// Simplified SM-2 spaced repetition. Pure function: no database, easy to unit test.

export const GRADES = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 };

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;
const AGAIN_DELAY_MS = 10 * 60 * 1000; // a forgotten card comes back in 10 minutes

// The interval "Good" gives: 1 day on the first rep, 3 on the second, then interval * ease
function goodInterval(card) {
  if (card.reps === 0) return 1;
  if (card.reps === 1) return 3;
  return card.interval_days * card.ease;
}

/**
 * card: { interval_days, ease, reps, lapses }
 * grade: 0 again, 1 hard, 2 good, 3 easy
 * now: Date
 * Returns the card's new { due_at, interval_days, ease, reps, lapses }.
 */
export function schedule(card, grade, now) {
  const { ease, lapses } = card;

  if (grade === GRADES.AGAIN) {
    return {
      due_at: new Date(now.getTime() + AGAIN_DELAY_MS),
      interval_days: 0,
      ease: Math.max(MIN_EASE, ease - 0.2),
      reps: 0,
      lapses: lapses + 1,
    };
  }

  let interval;
  let nextEase = ease;
  if (grade === GRADES.HARD) {
    interval = Math.max(1, card.interval_days * 1.2);
    nextEase = Math.max(MIN_EASE, ease - 0.15);
  } else if (grade === GRADES.GOOD) {
    interval = goodInterval(card);
  } else if (grade === GRADES.EASY) {
    // The plan's interval * ease * 1.3 would be 0 days for a new card,
    // so Easy is "what Good gives, times 1.3". Past the second rep it's the same thing.
    interval = goodInterval(card) * 1.3;
    nextEase = ease + 0.15;
  } else {
    throw new RangeError(`Unknown grade: ${grade}`);
  }

  return {
    due_at: new Date(now.getTime() + interval * DAY_MS),
    interval_days: interval,
    ease: nextEase,
    reps: card.reps + 1,
    lapses,
  };
}
