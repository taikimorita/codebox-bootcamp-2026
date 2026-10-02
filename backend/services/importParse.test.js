import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanField, parseDelimited, rowsToCards } from "./importParse.js";

test("parses comma-separated rows", () => {
  const { rows } = parseDelimited("犬,dog,いぬ\n猫,cat,ねこ\n");
  assert.deepEqual(rows, [
    ["犬", "dog", "いぬ"],
    ["猫", "cat", "ねこ"],
  ]);
});

test("detects tabs, and handles Windows line endings and a BOM", () => {
  const { rows } = parseDelimited("﻿Hund\tdog\r\nKatze\tcat\r\n");
  assert.deepEqual(rows, [
    ["Hund", "dog"],
    ["Katze", "cat"],
  ]);
});

test("quoted fields can hold the separator, newlines and escaped quotes", () => {
  const { rows } = parseDelimited(
    '"hello, world","line one\nline two"\n"say ""hi""",x\n',
  );
  assert.deepEqual(rows, [
    ["hello, world", "line one\nline two"],
    ['say "hi"', "x"],
  ]);
});

test("reads Anki's #separator and #html headers and skips them", () => {
  const text =
    "#separator:tab\n#html:true\n#columns:Front\tBack\n犬\t<b>dog</b>\n";
  const { rows, html } = parseDelimited(text);
  assert.equal(html, true);
  assert.deepEqual(rows, [["犬", "<b>dog</b>"]]);
});

test("Anki separator can be named or a literal character", () => {
  assert.deepEqual(parseDelimited("#separator:Semicolon\na;b\n").rows, [
    ["a", "b"],
  ]);
  assert.deepEqual(parseDelimited("#separator:|\na|b\n").rows, [["a", "b"]]);
});

test("a # in the data is kept once the headers are over", () => {
  const { rows } = parseDelimited("#separator:comma\n#1,first\n");
  assert.deepEqual(rows, [["#1", "first"]]);
});

test("blank lines are dropped", () => {
  assert.deepEqual(parseDelimited("a,b\n\n  \nc,d").rows, [
    ["a", "b"],
    ["c", "d"],
  ]);
});

test("cleanField strips HTML, turns <br> into newlines and decodes entities", () => {
  assert.equal(
    cleanField("<div>one<br>two</div><div>&lt;three&gt; &amp; four&nbsp;</div>", {
      html: true,
    }),
    "one\ntwo\n<three> & four",
  );
  assert.equal(cleanField("&#26085;&#x672C;", { html: true }), "日本");
});

test("cleanField removes [sound:] tags even without HTML", () => {
  assert.equal(cleanField("犬 [sound:inu.mp3]", { html: false }), "犬");
});

test("cleanField leaves < alone in plain text", () => {
  assert.equal(cleanField("a <b> c", { html: false }), "a <b> c");
});

test("cleanField drops script tags but keeps their text as plain text", () => {
  // Never rendered as HTML, so leftover text is harmless
  assert.equal(
    cleanField('<script>alert("x")</script>hi', { html: true }),
    'alert("x")hi',
  );
});

test("rowsToCards skips empty fronts/backs, overlong fields and duplicates", () => {
  const long = "x".repeat(1001);
  const { cards, skipped } = rowsToCards(
    [
      ["犬", "dog", "いぬ"],
      ["犬", "dog", "いぬ"], // duplicate
      ["猫", ""], // empty back
      ["[sound:a.mp3]", "sound only"], // empty after cleaning
      [long, "too long"],
      ["鳥", "bird"],
    ],
    { html: false, useReading: true },
  );
  assert.deepEqual(cards, [
    { front: "犬", back: "dog", reading: "いぬ" },
    { front: "鳥", back: "bird", reading: null },
  ]);
  assert.deepEqual(skipped, { empty: 2, tooLong: 1, duplicate: 1 });
});

test("rowsToCards ignores the third column unless useReading is set", () => {
  const { cards } = rowsToCards([["a", "b", "c"]], {
    html: false,
    useReading: false,
  });
  assert.deepEqual(cards, [{ front: "a", back: "b", reading: null }]);
});
