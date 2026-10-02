// Study streak from review days. Pure function: no database, easy to unit test.

const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (day) => Date.parse(`${day}T00:00:00Z`); // "2026-10-01" -> ms (UTC midnight)

/**
 * days: the "YYYY-MM-DD" dates (in the user's time zone) that have at least one review.
 * today: "YYYY-MM-DD" in the same time zone.
 * The streak counts consecutive days back from today. If there's no review today yet,
 * it counts back from yesterday instead, so the streak isn't lost before the day is over.
 */
export function computeStreak(days, today) {
  const reviewed = new Set(days);
  const reviewedToday = reviewed.has(today);
  let time = toTime(today) - (reviewedToday ? 0 : DAY_MS);
  let count = 0;
  while (reviewed.has(new Date(time).toISOString().slice(0, 10))) {
    count++;
    time -= DAY_MS;
  }
  return { days: count, reviewed_today: reviewedToday };
}
