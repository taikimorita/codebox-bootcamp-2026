import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { parseId } from "../utils/parseId.js";
import { isCorrectAnswer } from "./answerCheck.js";
import * as decks from "./deckService.js";
import { GRADES } from "./srs.js";
import * as study from "./studyService.js";

const TYPES = ["multiple_choice", "typing"];
const DEFAULT_COUNT = 10;
const MAX_COUNT = 50;
const MAX_ANSWER_LENGTH = 1000;

function validateType(type) {
  if (!TYPES.includes(type)) {
    throw new HttpError(400, `type must be one of: ${TYPES.join(", ")}`);
  }
  return type;
}

function parseCount(count) {
  if (count === undefined) return DEFAULT_COUNT;
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > MAX_COUNT) {
    throw new HttpError(
      400,
      `count must be a whole number from 1 to ${MAX_COUNT}`,
    );
  }
  return n;
}

// Fisher-Yates: returns a shuffled copy
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Random questions from one deck. The answers are NOT included:
 * checking happens on the server in answer() below.
 */
export async function getQuestions(userId, { deck: deckId, type, count }) {
  validateType(type);
  const limit = parseCount(count);
  const deck = await decks.getOne(userId, deckId); // 404s if it isn't theirs

  const { rows: cards } = await query(
    "select id, front, back from cards where deck_id = $1 and user_id = $2 order by random() limit $3",
    [deck.id, userId, limit],
  );
  if (cards.length === 0) throw new HttpError(400, "This deck has no cards yet");

  let questions;
  if (type === "multiple_choice") {
    // Distractors are other answers from the same deck. Duplicates don't count,
    // or a question could show the right answer twice.
    const { rows } = await query(
      "select distinct back from cards where deck_id = $1 and user_id = $2",
      [deck.id, userId],
    );
    const backs = rows.map((r) => r.back);
    if (backs.length < 4) {
      throw new HttpError(
        400,
        "Multiple choice needs at least 4 cards with different answers in the deck",
      );
    }
    questions = cards.map((card) => {
      const distractors = shuffle(backs.filter((b) => b !== card.back)).slice(
        0,
        3,
      );
      return {
        card_id: card.id,
        front: card.front,
        options: shuffle([card.back, ...distractors]),
      };
    });
  } else {
    questions = cards.map((card) => ({ card_id: card.id, front: card.front }));
  }

  return {
    deck: { id: deck.id, name: deck.name, language_code: deck.language_code },
    type,
    questions,
  };
}

// Checks one answer and records it as a review: correct counts as Good, wrong as Again
export async function answer(userId, { card_id, type, answer: given } = {}) {
  validateType(type);
  if (typeof given !== "string") {
    throw new HttpError(400, "answer must be text");
  }
  if ([...given].length > MAX_ANSWER_LENGTH) {
    throw new HttpError(400, "answer is too long");
  }

  const { rows } = await query(
    `select c.id, c.back, c.reading, d.language_code
     from cards c join decks d on d.id = c.deck_id
     where c.id = $1 and c.user_id = $2`,
    [parseId(card_id, "card id"), userId],
  );
  const card = rows[0];
  if (!card) throw new HttpError(404, "Card not found");

  // Multiple choice options are exact backs, so compare exactly
  const correct =
    type === "multiple_choice"
      ? given === card.back
      : isCorrectAnswer(given, card, card.language_code);

  await study.review(userId, card.id, {
    grade: correct ? GRADES.GOOD : GRADES.AGAIN,
    mode: type,
  });
  return { correct, expected: card.back, reading: card.reading };
}
