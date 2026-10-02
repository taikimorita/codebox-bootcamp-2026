import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { computeStreak } from "./streak.js";

// "Today" depends on where the user is, so the browser sends its IANA time zone.
// Only names like "Europe/Berlin": Postgres reads raw offsets like "+05:00" with the sign flipped.
const ZONE_NAME = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/;

function validateTimeZone(tz) {
  if (tz === undefined) return "UTC";
  try {
    if (typeof tz !== "string" || !ZONE_NAME.test(tz)) throw new RangeError();
    new Intl.DateTimeFormat("en", { timeZone: tz }); // throws for unknown zones
    return tz;
  } catch {
    throw new HttpError(400, "Unknown time zone");
  }
}

export async function summary(userId, { tz } = {}) {
  const timeZone = validateTimeZone(tz);

  const { rows: byLanguage } = await query(
    `select d.language_code,
       count(*)::int as total,
       count(*) filter (where c.due_at <= now())::int as due
     from cards c join decks d on d.id = c.deck_id
     where c.user_id = $1
     group by d.language_code`,
    [userId],
  );

  // Midnight today in the user's zone, as a timestamptz, so the index on reviewed_at can be used
  const { rows: todayRows } = await query(
    `select to_char(now() at time zone $2, 'YYYY-MM-DD') as today,
       (select count(*)::int from reviews
        where user_id = $1
          and reviewed_at >= date_trunc('day', now() at time zone $2) at time zone $2
       ) as reviews_today`,
    [userId, timeZone],
  );

  const { rows: dayRows } = await query(
    `select distinct to_char(reviewed_at at time zone $2, 'YYYY-MM-DD') as day
     from reviews where user_id = $1`,
    [userId, timeZone],
  );

  const { today, reviews_today } = todayRows[0];
  return {
    by_language: byLanguage,
    reviews_today,
    streak: computeStreak(dayRows.map((r) => r.day), today),
  };
}
