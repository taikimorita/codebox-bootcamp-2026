// Parsing and cleaning for imports. Pure functions: no database, no files, easy to unit test.

const MAX_FIELD_LENGTH = 1000; // matches the cards table's check constraint

// Anki's "#separator:" header values
const SEPARATORS = {
  tab: "\t",
  comma: ",",
  semicolon: ";",
  pipe: "|",
  space: " ",
  colon: ":",
};

/**
 * Parses CSV/TSV text, including Anki's "Notes in Plain Text" export.
 * Anki puts "#key:value" lines at the top (#separator:tab, #html:true, ...).
 * Fields may be wrapped in "double quotes" to contain the separator, newlines or "" (a quote).
 * Returns { rows: string[][], html: boolean }.
 */
export function parseDelimited(text) {
  let body = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  const headers = {};
  for (;;) {
    const match = body.match(/^#([a-z ]+):(.*)\n?/i);
    if (!match) break;
    headers[match[1].trim().toLowerCase()] = match[2].trim();
    body = body.slice(match[0].length);
  }

  const named = headers.separator?.toLowerCase();
  const delimiter =
    SEPARATORS[named] ??
    (headers.separator?.length === 1 ? headers.separator : null) ??
    (body.split("\n", 1)[0].includes("\t") ? "\t" : ",");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuotes) {
      if (ch === '"' && body[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return {
    rows: rows.filter((r) => r.some((f) => f.trim() !== "")),
    html: headers.html?.toLowerCase() === "true",
  };
}

const ENTITIES = { nbsp: " ", lt: "<", gt: ">", quot: '"', apos: "'" };

// Numeric entities outside the Unicode range are left as they were
function fromCodePoint(n, original) {
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : original;
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    const lower = code.toLowerCase();
    if (lower.startsWith("#x"))
      return fromCodePoint(parseInt(lower.slice(2), 16), match);
    if (lower.startsWith("#"))
      return fromCodePoint(parseInt(lower.slice(1), 10), match);
    if (lower === "amp") return "&";
    return ENTITIES[lower] ?? match;
  });
}

/**
 * Turns one imported field into plain text: removes [sound:...] tags and,
 * when the field is HTML, turns <br>/<div>/<p> into line breaks, drops every
 * other tag and decodes entities. The result is shown as plain text, never as HTML.
 */
export function cleanField(value, { html }) {
  let text = String(value ?? "").replace(/\[sound:[^\]]*\]/g, "");
  if (html) {
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|li)>/gi, "\n")
      .replace(/<[^>]*>/g, "");
    text = decodeEntities(text);
  }
  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Turns parsed rows into cards: column 1 = front, 2 = back, 3 = reading (if useReading).
 * Skips rows with an empty front or back, fields over 1000 characters, and duplicates.
 * Returns { cards: [{ front, back, reading }], skipped: { empty, tooLong, duplicate } }.
 */
export function rowsToCards(rows, { html, useReading }) {
  const cards = [];
  const skipped = { empty: 0, tooLong: 0, duplicate: 0 };
  const seen = new Set();

  for (const row of rows) {
    const front = cleanField(row[0], { html });
    const back = cleanField(row[1], { html });
    const reading = useReading ? cleanField(row[2], { html }) || null : null;

    if (!front || !back) {
      skipped.empty++;
      continue;
    }
    if (
      [front, back, reading ?? ""].some((f) => [...f].length > MAX_FIELD_LENGTH)
    ) {
      skipped.tooLong++;
      continue;
    }
    const key = `${front}\x1f${back}`;
    if (seen.has(key)) {
      skipped.duplicate++;
      continue;
    }
    seen.add(key);
    cards.push({ front, back, reading });
  }
  return { cards, skipped };
}
