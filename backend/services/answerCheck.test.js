import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrectAnswer, normalizeAnswer } from "./answerCheck.js";

test("trims, collapses whitespace and ignores case", () => {
  assert.equal(normalizeAnswer("  Good   Morning ", "en"), "good morning");
  assert.ok(isCorrectAnswer("GOOD morning", { back: "good morning" }, "en"));
});

test("strips trailing punctuation, including full-width", () => {
  assert.ok(isCorrectAnswer("thank you!", { back: "Thank you" }, "en"));
  assert.ok(isCorrectAnswer("ありがとう", { back: "ありがとう。" }, "ja"));
  assert.ok(isCorrectAnswer("Wie geht's?", { back: "wie geht's" }, "de"));
});

test("keeps punctuation that isn't at the end", () => {
  assert.equal(normalizeAnswer("wie geht's", "de"), "wie geht's");
  assert.ok(!isCorrectAnswer("wie gehts", { back: "wie geht's" }, "de"));
});

test("treats composed and decomposed accents as the same (NFC)", () => {
  const composed = "café"; // é as one character
  const decomposed = "café"; // e + combining accent
  assert.ok(isCorrectAnswer(decomposed, { back: composed }, "sv"));
});

test("Turkish: İ lowercases to i, not i + dot", () => {
  assert.ok(isCorrectAnswer("İSTANBUL", { back: "istanbul" }, "tr"));
  // Plain toLowerCase would produce "i̇stanbul" (with a combining dot) and fail
  assert.notEqual("İSTANBUL".toLowerCase(), "istanbul");
});

test("Turkish: I lowercases to dotless ı", () => {
  assert.ok(isCorrectAnswer("ILIK", { back: "ılık" }, "tr"));
  assert.ok(!isCorrectAnswer("ILIK", { back: "ilik" }, "tr"));
});

test("Japanese: kana is accepted when the reading holds the kana", () => {
  const card = { front: "犬", back: "dog", reading: "いぬ" };
  assert.ok(isCorrectAnswer("いぬ", card, "ja"));
  assert.ok(isCorrectAnswer("Dog", card, "ja"));
  assert.ok(!isCorrectAnswer("ねこ", card, "ja"));
});

test("Russian lowercases Cyrillic", () => {
  assert.ok(isCorrectAnswer("СОБАКА", { back: "собака" }, "ru"));
});

test("an empty or punctuation-only answer is never correct", () => {
  assert.ok(!isCorrectAnswer("", { back: "dog" }, "en"));
  assert.ok(!isCorrectAnswer("   ", { back: "dog" }, "en"));
  assert.ok(!isCorrectAnswer("?!", { back: "!!" }, "en"));
});

test("a card with no reading only accepts the back", () => {
  assert.ok(isCorrectAnswer("hund", { back: "Hund", reading: null }, "de"));
  assert.ok(!isCorrectAnswer("", { back: "Hund", reading: null }, "de"));
});
