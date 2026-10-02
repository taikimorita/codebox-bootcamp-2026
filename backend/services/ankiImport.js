// Reads notes out of an Anki .apkg, entirely in memory.
// An .apkg is a zip holding a SQLite database (the "collection") plus media files we skip.
import { unzipSync } from "fflate";
import { Decompress } from "fzstd";
import initSqlJs from "sql.js";
import { HttpError } from "../utils/HttpError.js";

export const MAX_COLLECTION_BYTES = 100 * 1024 * 1024;
export const MAX_NOTES = 5000;
const ZSTD_CHUNK = 64 * 1024;

// Newest format first. Newer exports also contain a collection.anki2 that is only a
// placeholder note saying "please update Anki", so it must be the last choice.
const COLLECTION_FILES = [
  "collection.anki21b", // zstd-compressed (Anki 2.1.50+)
  "collection.anki21",
  "collection.anki2",
];

const OLDER_VERSIONS_HINT =
  'Try exporting again from Anki with "Support older Anki versions" ticked.';

const tooLarge = () =>
  new HttpError(400, "The Anki collection in this file is too large");

function isZip(bytes) {
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
}

function isSqlite(bytes) {
  const header = "SQLite format 3\0";
  if (bytes.length < header.length) return false;
  for (let i = 0; i < header.length; i++)
    if (bytes[i] !== header.charCodeAt(i)) return false;
  return true;
}

// Decompresses in chunks and stops as soon as the output passes maxBytes,
// so a small file can't expand into gigabytes (a "zip bomb").
function decompressZstd(data, maxBytes) {
  const chunks = [];
  let total = 0;
  const stream = new Decompress((chunk) => {
    total += chunk.length;
    if (total > maxBytes) throw tooLarge();
    chunks.push(chunk.slice()); // copy: the library may reuse its buffer
  });
  try {
    for (let i = 0; i < data.length; i += ZSTD_CHUNK) {
      const last = i + ZSTD_CHUNK >= data.length;
      stream.push(data.subarray(i, i + ZSTD_CHUNK), last);
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(
      400,
      `The Anki collection couldn't be decompressed. ${OLDER_VERSIONS_HINT}`,
    );
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Pulls the SQLite collection out of an .apkg buffer.
 * Only the collection file is extracted, and only if its declared size is under maxBytes.
 */
export function extractCollection(
  buffer,
  { maxBytes = MAX_COLLECTION_BYTES } = {},
) {
  if (!isZip(buffer))
    throw new HttpError(400, "That isn't an Anki .apkg file");

  let files;
  try {
    files = unzipSync(new Uint8Array(buffer), {
      // Runs before each entry is extracted. Media and everything else is never decompressed.
      filter: (entry) => {
        if (!COLLECTION_FILES.includes(entry.name)) return false;
        if (entry.originalSize > maxBytes) throw tooLarge();
        return true;
      },
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "That file isn't a valid .apkg (zip) file");
  }

  const name = COLLECTION_FILES.find((n) => files[n]);
  if (!name) {
    throw new HttpError(
      400,
      "No Anki collection found. Is this an Anki deck export?",
    );
  }
  const data =
    name === "collection.anki21b"
      ? decompressZstd(files[name], maxBytes)
      : files[name];
  if (!isSqlite(data)) {
    throw new HttpError(
      400,
      `The Anki collection couldn't be read. ${OLDER_VERSIONS_HINT}`,
    );
  }
  return data;
}

let sqlPromise = null;
function getSql() {
  // Load the WebAssembly once; if that fails, try again next time
  sqlPromise ??= initSqlJs().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}

/**
 * Reads every note's fields from the collection. Anki separates fields with \x1f.
 * Returns string[][] (one array of fields per note).
 */
export async function readNotes(collection, { maxNotes = MAX_NOTES } = {}) {
  const SQL = await getSql();
  let db;
  try {
    db = new SQL.Database(collection);
  } catch {
    throw new HttpError(
      400,
      `The Anki collection couldn't be opened. ${OLDER_VERSIONS_HINT}`,
    );
  }
  try {
    const count = db.exec("select count(*) from notes")[0].values[0][0];
    if (count > maxNotes) {
      throw new HttpError(
        400,
        `This deck has ${count} notes. The limit is ${maxNotes}.`,
      );
    }
    const result = db.exec("select flds from notes order by id");
    const rows = result[0]?.values ?? [];
    return rows.map(([flds]) => String(flds).split("\x1f"));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(
      400,
      `The notes in this deck couldn't be read. ${OLDER_VERSIONS_HINT}`,
    );
  } finally {
    db.close();
  }
}
