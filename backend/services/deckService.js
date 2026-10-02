import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { parseId } from "../utils/parseId.js";
import { validateCode } from "./languageService.js";

const DECK_COLUMNS = `d.id, d.language_code, l.name as language_name,
  l.native_name as language_native_name, d.name, d.source, d.created_at,
  (select count(*)::int from cards c where c.deck_id = d.id) as card_count`;
const FROM = "from decks d join languages l on l.code = d.language_code";

function validateName(name) {
  if (typeof name !== "string" || !name.trim()) {
    throw new HttpError(400, "Deck name is required");
  }
  const trimmed = name.trim();
  // [...str] counts characters the way Postgres char_length does (emoji count as 1)
  if ([...trimmed].length > 100) {
    throw new HttpError(400, "Deck name must be 100 characters or fewer");
  }
  return trimmed;
}

async function validateLanguage(code) {
  if (code === undefined || code === null) {
    throw new HttpError(400, "Language is required");
  }
  return validateCode(code);
}

export async function list(userId) {
  const { rows } = await query(
    `select ${DECK_COLUMNS} ${FROM}
     where d.user_id = $1
     order by l.name, lower(d.name)`,
    [userId],
  );
  return rows;
}

export async function getOne(userId, id) {
  const { rows } = await query(
    `select ${DECK_COLUMNS} ${FROM} where d.id = $1 and d.user_id = $2`,
    [parseId(id, "deck id"), userId],
  );
  if (!rows[0]) throw new HttpError(404, "Deck not found");
  return rows[0];
}

export async function create(userId, { name, language_code }) {
  const { rows } = await query(
    "insert into decks (user_id, language_code, name) values ($1, $2, $3) returning id",
    [userId, await validateLanguage(language_code), validateName(name)],
  );
  return getOne(userId, rows[0].id);
}

export async function update(userId, id, body) {
  const deck = await getOne(userId, id);
  const name = body.name !== undefined ? validateName(body.name) : deck.name;
  const languageCode =
    body.language_code !== undefined
      ? await validateLanguage(body.language_code)
      : deck.language_code;
  await query(
    "update decks set name = $1, language_code = $2 where id = $3 and user_id = $4",
    [name, languageCode, deck.id, userId],
  );
  return getOne(userId, deck.id);
}

// Cards go with it (on delete cascade)
export async function remove(userId, id) {
  const { rowCount } = await query(
    "delete from decks where id = $1 and user_id = $2",
    [parseId(id, "deck id"), userId],
  );
  if (rowCount === 0) throw new HttpError(404, "Deck not found");
}
