import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync } from "fflate";
import initSqlJs from "sql.js";
import { extractCollection, readNotes } from "./ankiImport.js";

const SQL = await initSqlJs();

// A minimal Anki-like collection: just the notes table with \x1f-separated fields
function makeCollection(notes) {
  const db = new SQL.Database();
  db.run("create table notes (id integer primary key, flds text not null)");
  for (const fields of notes)
    db.run("insert into notes (flds) values (?)", [fields.join("\x1f")]);
  const bytes = db.export();
  db.close();
  return bytes;
}

// A valid zstd frame holding `data` as one uncompressed ("raw") block.
// Node 22 can't compress zstd, but this is enough to exercise the .anki21b path.
function zstdRaw(data) {
  assert.ok(data.length >= 256 && data.length < 65792, "fits a 2-byte size field");
  const size = data.length - 256;
  const blockHeader = 1 | (data.length << 3); // last block, raw type
  return new Uint8Array([
    0x28, 0xb5, 0x2f, 0xfd, // magic number
    0x60, // single segment, 2-byte content size
    size & 0xff, size >> 8,
    blockHeader & 0xff, (blockHeader >> 8) & 0xff, (blockHeader >> 16) & 0xff,
    ...data,
  ]);
}

// A tiny zstd frame that expands to `count` copies of one byte (an RLE block): a zstd "bomb"
function zstdRle(byte, count) {
  const size = count - 256;
  const blockHeader = 1 | (1 << 1) | (count << 3); // last block, RLE type
  return new Uint8Array([
    0x28, 0xb5, 0x2f, 0xfd,
    0x60,
    size & 0xff, size >> 8,
    blockHeader & 0xff, (blockHeader >> 8) & 0xff, (blockHeader >> 16) & 0xff,
    byte,
  ]);
}

const apkg = (files) => Buffer.from(zipSync(files));
const err400 = (pattern) => (err) => err.status === 400 && pattern.test(err.message);

test("reads notes from collection.anki21 and splits fields", async () => {
  const file = apkg({
    "collection.anki21": makeCollection([
      ["犬", "dog", "extra"],
      ["猫", "cat"],
    ]),
    media: new TextEncoder().encode("{}"),
  });
  assert.deepEqual(await readNotes(extractCollection(file)), [
    ["犬", "dog", "extra"],
    ["猫", "cat"],
  ]);
});

test("prefers collection.anki21 over the collection.anki2 placeholder", async () => {
  const file = apkg({
    "collection.anki2": makeCollection([["Please update to the latest Anki", ""]]),
    "collection.anki21": makeCollection([["real", "note"]]),
  });
  assert.deepEqual(await readNotes(extractCollection(file)), [["real", "note"]]);
});

test("reads a zstd-compressed collection.anki21b", async () => {
  const file = apkg({
    "collection.anki2": makeCollection([["placeholder", ""]]),
    "collection.anki21b": zstdRaw(makeCollection([["Hund", "dog"]])),
  });
  assert.deepEqual(await readNotes(extractCollection(file)), [["Hund", "dog"]]);
});

test("falls back to collection.anki2 when it's the only collection", async () => {
  const file = apkg({ "collection.anki2": makeCollection([["old", "export"]]) });
  assert.deepEqual(await readNotes(extractCollection(file)), [["old", "export"]]);
});

test("rejects a file that isn't a zip", () => {
  assert.throws(
    () => extractCollection(Buffer.from("front,back\n")),
    err400(/isn't an Anki .apkg/),
  );
});

test("rejects a zip without an Anki collection", () => {
  const file = apkg({ "notes.txt": new TextEncoder().encode("hello") });
  assert.throws(() => extractCollection(file), err400(/No Anki collection/));
});

test("rejects a broken zip", () => {
  const file = Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
  assert.throws(() => extractCollection(file), err400(/valid .apkg/));
});

test("refuses a collection whose declared size is over the limit, before extracting it", () => {
  const collection = makeCollection([["a", "b"]]);
  const file = apkg({ "collection.anki21": collection });
  assert.throws(
    () => extractCollection(file, { maxBytes: collection.length - 1 }),
    err400(/too large/),
  );
});

test("stops decompressing zstd once the output passes the limit", () => {
  // 11 bytes in the zip, 60,000 once decompressed
  const file = apkg({ "collection.anki21b": zstdRle(0x41, 60000) });
  assert.throws(
    () => extractCollection(file, { maxBytes: 1000 }),
    err400(/too large/),
  );
  // Same file with a high enough limit gets past decompression (then fails: not SQLite)
  assert.throws(
    () => extractCollection(file, { maxBytes: 100000 }),
    err400(/couldn't be read/),
  );
});

test("rejects corrupt zstd data", () => {
  const file = apkg({ "collection.anki21b": new Uint8Array([1, 2, 3, 4, 5]) });
  assert.throws(() => extractCollection(file), err400(/couldn't be decompressed/));
});

test("rejects a collection that isn't SQLite", () => {
  const file = apkg({ "collection.anki21": new TextEncoder().encode("not a database") });
  assert.throws(() => extractCollection(file), err400(/couldn't be read/));
});

test("rejects a deck with more notes than the limit", async () => {
  const collection = makeCollection([["1", "a"], ["2", "b"], ["3", "c"]]);
  await assert.rejects(readNotes(collection, { maxNotes: 2 }), err400(/3 notes/));
});

test("rejects a database without a notes table", async () => {
  const db = new SQL.Database();
  db.run("create table other (x)");
  const bytes = db.export();
  db.close();
  await assert.rejects(readNotes(bytes), err400(/couldn't be read/));
});
