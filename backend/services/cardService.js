import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { parseId } from "../utils/parseId.js";
import * as decks from "./deckService.js";

const MAX_LENGTH = 1000;

// Trims text fields. Optional fields that are empty become null.
function validateText(value, label, required) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    if (required) throw new HttpError(400, `${label} is required`);
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, `${label} must be text`);
  }
  const trimmed = value.trim();
  if ([...trimmed].length > MAX_LENGTH) {
    throw new HttpError(
      400,
      `${label} must be ${MAX_LENGTH} characters or fewer`,
    );
  }
  return trimmed;
}

const FIELDS = [
  { key: "front", label: "Front", required: true },
  { key: "back", label: "Back", required: true },
  { key: "reading", label: "Reading", required: false },
  { key: "notes", label: "Notes", required: false },
];

export async function listForDeck(userId, deckId) {
  const deck = await decks.getOne(userId, deckId); // 404s if it isn't theirs
  const { rows } = await query(
    "select * from cards where deck_id = $1 and user_id = $2 order by created_at, id",
    [deck.id, userId],
  );
  return rows;
}

export async function getOne(userId, id) {
  const { rows } = await query(
    "select * from cards where id = $1 and user_id = $2",
    [parseId(id, "card id"), userId],
  );
  if (!rows[0]) throw new HttpError(404, "Card not found");
  return rows[0];
}

export async function create(userId, deckId, body) {
  const deck = await decks.getOne(userId, deckId); // only add to your own decks
  const [front, back, reading, notes] = FIELDS.map((f) =>
    validateText(body[f.key], f.label, f.required),
  );
  const { rows } = await query(
    `insert into cards (deck_id, user_id, front, back, reading, notes)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [deck.id, userId, front, back, reading, notes],
  );
  return rows[0];
}

export async function update(userId, id, body) {
  const card = await getOne(userId, id);
  const [front, back, reading, notes] = FIELDS.map((f) =>
    body[f.key] !== undefined
      ? validateText(body[f.key], f.label, f.required)
      : card[f.key],
  );
  const { rows } = await query(
    `update cards set front = $1, back = $2, reading = $3, notes = $4, updated_at = now()
     where id = $5 and user_id = $6 returning *`,
    [front, back, reading, notes, card.id, userId],
  );
  return rows[0];
}

export async function remove(userId, id) {
  const { rowCount } = await query(
    "delete from cards where id = $1 and user_id = $2",
    [parseId(id, "card id"), userId],
  );
  if (rowCount === 0) throw new HttpError(404, "Card not found");
}
