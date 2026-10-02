import { query, transaction } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { parseId } from "../utils/parseId.js";
import { validateCode } from "./languageService.js";
import { schedule } from "./srs.js";

const MODES = ["flashcard", "multiple_choice", "typing"];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(limit) {
  if (limit === undefined) return DEFAULT_LIMIT;
  const n = Number(limit);
  if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
    throw new HttpError(
      400,
      `limit must be a whole number from 1 to ${MAX_LIMIT}`,
    );
  }
  return n;
}

// Due cards, oldest first, plus how many are due in total (the batch may be smaller)
export async function queue(userId, { language, limit } = {}) {
  const params = [userId];
  let languageFilter = "";
  if (language !== undefined) {
    params.push(await validateCode(language));
    languageFilter = `and d.language_code = $${params.length}`;
  }
  const from = `from cards c join decks d on d.id = c.deck_id
    where c.user_id = $1 and c.due_at <= now() ${languageFilter}`;

  const { rows: countRows } = await query(
    `select count(*)::int as total ${from}`,
    params,
  );
  const { rows: cards } = await query(
    `select c.id, c.deck_id, c.front, c.back, c.reading, c.notes, c.due_at, c.reps,
       d.name as deck_name, d.language_code
     ${from}
     order by c.due_at, c.id
     limit $${params.length + 1}`,
    [...params, parseLimit(limit)],
  );
  return { total_due: countRows[0].total, cards };
}

// Schedules the card and logs the review together: either both happen or neither does
export async function review(userId, cardId, { grade, mode } = {}) {
  const id = parseId(cardId, "card id");
  if (!Number.isInteger(grade) || grade < 0 || grade > 3) {
    throw new HttpError(400, "grade must be 0, 1, 2 or 3");
  }
  if (!MODES.includes(mode)) {
    throw new HttpError(400, `mode must be one of: ${MODES.join(", ")}`);
  }

  return transaction(async (client) => {
    // "for update" locks the row, so two quick reviews of one card can't both read the old state
    const { rows } = await client.query(
      "select * from cards where id = $1 and user_id = $2 for update",
      [id, userId],
    );
    if (!rows[0]) throw new HttpError(404, "Card not found");

    const next = schedule(rows[0], grade, new Date());
    const { rows: updated } = await client.query(
      `update cards set due_at = $1, interval_days = $2, ease = $3, reps = $4, lapses = $5,
         updated_at = now()
       where id = $6 and user_id = $7 returning *`,
      [
        next.due_at,
        next.interval_days,
        next.ease,
        next.reps,
        next.lapses,
        id,
        userId,
      ],
    );
    await client.query(
      "insert into reviews (card_id, user_id, grade, mode) values ($1, $2, $3, $4)",
      [id, userId, grade, mode],
    );
    return updated[0];
  });
}
