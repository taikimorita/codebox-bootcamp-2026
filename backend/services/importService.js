import { query, transaction } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { extractCollection, readNotes } from "./ankiImport.js";
import * as decks from "./deckService.js";
import { parseDelimited, rowsToCards } from "./importParse.js";

const MAX_ROWS = 5000;
const BATCH_SIZE = 500;
const PREVIEW_SIZE = 5;

function requireFile(file) {
  if (!file?.buffer?.length) throw new HttpError(400, "Choose a file to import");
}

function decodeText(buffer) {
  // Zip files (like .apkg) start with "PK"
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    throw new HttpError(
      400,
      "That looks like an Anki .apkg file. Use the Anki import instead.",
    );
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new HttpError(400, "The file must be UTF-8 text (CSV or TSV)");
  }
}

// How many of these cards the deck already has (same front and back)
async function countExisting(userId, deckId, cards) {
  const { rows } = await query(
    `select count(*)::int as n
     from unnest($1::text[], $2::text[]) as t(front, back)
     where exists (
       select 1 from cards c
       where c.deck_id = $3 and c.user_id = $4 and c.front = t.front and c.back = t.back
     )`,
    [cards.map((c) => c.front), cards.map((c) => c.back), deckId, userId],
  );
  return rows[0].n;
}

/**
 * Inserts cards in batches using the given transaction client, skipping any the deck
 * already has. Returns how many were inserted.
 */
export async function insertCards(client, userId, deckId, cards) {
  let inserted = 0;
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const { rowCount } = await client.query(
      `insert into cards (deck_id, user_id, front, back, reading)
       select $1, $2, t.front, t.back, t.reading
       from unnest($3::text[], $4::text[], $5::text[]) as t(front, back, reading)
       where not exists (
         select 1 from cards c
         where c.deck_id = $1 and c.user_id = $2
           and c.front = t.front and c.back = t.back
       )`,
      [
        deckId,
        userId,
        batch.map((c) => c.front),
        batch.map((c) => c.back),
        batch.map((c) => c.reading),
      ],
    );
    inserted += rowCount;
  }
  return inserted;
}

/**
 * CSV/TSV into an existing deck. Columns: front, back, optional reading.
 * With preview, nothing is saved: it returns what would be imported.
 */
export async function importCsv(userId, deckId, file, { preview }) {
  const deck = await decks.getOne(userId, deckId); // 404s if it isn't theirs
  requireFile(file);

  const { rows, html } = parseDelimited(decodeText(file.buffer));
  if (rows.length > MAX_ROWS) {
    throw new HttpError(
      400,
      `The file has ${rows.length} rows. The limit is ${MAX_ROWS}.`,
    );
  }
  const { cards, skipped } = rowsToCards(rows, { html, useReading: true });

  if (preview) {
    const existing =
      cards.length > 0 ? await countExisting(userId, deck.id, cards) : 0;
    return {
      total: cards.length - existing,
      skipped: { ...skipped, existing },
      preview: cards.slice(0, PREVIEW_SIZE),
    };
  }

  if (cards.length === 0) {
    throw new HttpError(400, "No cards found in the file");
  }
  const imported = await transaction((client) =>
    insertCards(client, userId, deck.id, cards),
  );
  return {
    imported,
    skipped: { ...skipped, existing: cards.length - imported },
  };
}

/**
 * An Anki .apkg into a new deck. Field 1 = front, field 2 = back; HTML and sound tags are stripped.
 * With preview, nothing is saved (and name/language aren't needed yet).
 */
export async function importAnki(userId, file, options) {
  const { name, language_code, preview } = options;
  requireFile(file);
  // Check the cheap things before unzipping
  const deckName = preview ? null : decks.validateName(name);
  const languageCode = preview
    ? null
    : await decks.validateLanguage(language_code);

  const rows = await readNotes(extractCollection(file.buffer));
  const { cards, skipped } = rowsToCards(rows, {
    html: true,
    useReading: false,
  });

  if (preview) {
    return {
      total: cards.length,
      skipped: { ...skipped, existing: 0 },
      preview: cards.slice(0, PREVIEW_SIZE),
    };
  }
  if (cards.length === 0) {
    throw new HttpError(
      400,
      "No cards with a front and back found in the deck",
    );
  }

  // The deck and its cards are created together: a failure leaves no empty deck behind
  return transaction(async (client) => {
    const { rows: created } = await client.query(
      `insert into decks (user_id, language_code, name, source)
       values ($1, $2, $3, 'anki') returning id`,
      [userId, languageCode, deckName],
    );
    const deckId = created[0].id;
    const imported = await insertCards(client, userId, deckId, cards);
    return { deck_id: deckId, imported, skipped: { ...skipped, existing: 0 } };
  });
}
