// Typed-answer checking. Pure functions: no database, easy to unit test.

/**
 * Puts an answer in a form that can be compared:
 * NFC-normalize, trim, collapse whitespace, lowercase using the card's language
 * (Turkish İ/ı need 'tr', plain toLowerCase gets them wrong), strip trailing punctuation.
 */
export function normalizeAnswer(text, locale) {
  return text
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase(locale)
    .replace(/[\p{P}\s]+$/u, ""); // \p{P} covers full-width punctuation like 。！？ too
}

// Correct if it matches the back or the reading (so kana counts for a kanji card)
export function isCorrectAnswer(answer, card, locale) {
  const given = normalizeAnswer(answer, locale);
  if (!given) return false;
  return [card.back, card.reading].some(
    (expected) => expected && normalizeAnswer(expected, locale) === given,
  );
}
