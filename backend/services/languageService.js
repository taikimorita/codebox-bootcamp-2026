import { query, transaction } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";

const COLUMNS = "l.code, l.name, l.native_name, l.tts_locale";

export async function listAll() {
  const { rows } = await query(
    `select ${COLUMNS} from languages l order by l.name`,
  );
  return rows;
}

export async function listForUser(userId) {
  const { rows } = await query(
    `select ${COLUMNS} from user_languages ul
     join languages l on l.code = ul.language_code
     where ul.user_id = $1
     order by l.name`,
    [userId],
  );
  return rows;
}

// Returns the codes that don't exist in the languages table
async function findUnknown(codes) {
  const { rows } = await query(
    "select code from languages where code = any($1)",
    [codes],
  );
  const known = new Set(rows.map((r) => r.code));
  return codes.filter((c) => !known.has(c));
}

// Validates an optional language tag (used by todos). null/undefined mean "no language".
export async function validateCode(code) {
  if (code === undefined || code === null) return null;
  if (typeof code !== "string" || (await findUnknown([code])).length > 0) {
    throw new HttpError(400, "Unknown language code");
  }
  return code;
}

export async function setForUser(userId, codes) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new HttpError(400, "Pick at least one language");
  }
  if (!codes.every((c) => typeof c === "string")) {
    throw new HttpError(400, "Language codes must be strings");
  }
  const unique = [...new Set(codes)];
  const unknown = await findUnknown(unique);
  if (unknown.length > 0) {
    throw new HttpError(400, `Unknown language code: ${unknown.join(", ")}`);
  }

  // Replace the whole selection in one go, so a failure can't leave half of it
  await transaction(async (client) => {
    await client.query("delete from user_languages where user_id = $1", [
      userId,
    ]);
    await client.query(
      "insert into user_languages (user_id, language_code) select $1, unnest($2::text[])",
      [userId, unique],
    );
  });
  return listForUser(userId);
}
