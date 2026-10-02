import { test } from "node:test";
import assert from "node:assert/strict";
import { schedule, GRADES } from "./srs.js";

const NOW = new Date("2026-10-01T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const newCard = { interval_days: 0, ease: 2.5, reps: 0, lapses: 0 };
const matureCard = { interval_days: 10, ease: 2.5, reps: 5, lapses: 1 };

// Floating point: compare to 6 decimal places
const close = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `expected ${expected}, got ${actual}`,
  );
const daysFromNow = (date) => (date.getTime() - NOW.getTime()) / DAY_MS;

test("Again resets reps, adds a lapse, lowers ease and is due in 10 minutes", () => {
  const next = schedule(matureCard, GRADES.AGAIN, NOW);
  assert.equal(next.reps, 0);
  assert.equal(next.lapses, 2);
  assert.equal(next.interval_days, 0);
  close(next.ease, 2.3);
  assert.equal(next.due_at.getTime() - NOW.getTime(), 10 * 60 * 1000);
});

test("Again never takes ease below 1.3", () => {
  const next = schedule({ ...matureCard, ease: 1.4 }, GRADES.AGAIN, NOW);
  close(next.ease, 1.3);
  close(schedule({ ...matureCard, ease: 1.3 }, GRADES.AGAIN, NOW).ease, 1.3);
});

test("Hard multiplies the interval by 1.2 and lowers ease by 0.15", () => {
  const next = schedule(matureCard, GRADES.HARD, NOW);
  close(next.interval_days, 12);
  close(next.ease, 2.35);
  assert.equal(next.reps, 6);
  assert.equal(next.lapses, 1);
  close(daysFromNow(next.due_at), 12);
});

test("Hard on a new card is at least 1 day", () => {
  const next = schedule(newCard, GRADES.HARD, NOW);
  close(next.interval_days, 1);
  close(daysFromNow(next.due_at), 1);
});

test("Hard never takes ease below 1.3", () => {
  close(schedule({ ...matureCard, ease: 1.35 }, GRADES.HARD, NOW).ease, 1.3);
});

test("Good is 1 day on the first rep", () => {
  const next = schedule(newCard, GRADES.GOOD, NOW);
  close(next.interval_days, 1);
  close(daysFromNow(next.due_at), 1);
  assert.equal(next.reps, 1);
  close(next.ease, 2.5);
});

test("Good is 3 days on the second rep", () => {
  const next = schedule(
    { interval_days: 1, ease: 2.5, reps: 1, lapses: 0 },
    GRADES.GOOD,
    NOW,
  );
  close(next.interval_days, 3);
  assert.equal(next.reps, 2);
});

test("Good after that is interval * ease, with ease unchanged", () => {
  const next = schedule(matureCard, GRADES.GOOD, NOW);
  close(next.interval_days, 25);
  close(next.ease, 2.5);
  close(daysFromNow(next.due_at), 25);
});

test("Easy is interval * ease * 1.3 and raises ease by 0.15", () => {
  const next = schedule(matureCard, GRADES.EASY, NOW);
  close(next.interval_days, 32.5);
  close(next.ease, 2.65);
  assert.equal(next.reps, 6);
});

test("Easy on a new card is scheduled in the future, beyond Good", () => {
  const easy = schedule(newCard, GRADES.EASY, NOW);
  const good = schedule(newCard, GRADES.GOOD, NOW);
  close(easy.interval_days, 1.3);
  assert.ok(easy.interval_days > good.interval_days);
});

test("A card that lapsed starts over at 1 day, then 3", () => {
  const lapsed = schedule(matureCard, GRADES.AGAIN, NOW);
  const first = schedule(lapsed, GRADES.GOOD, NOW);
  close(first.interval_days, 1);
  close(schedule(first, GRADES.GOOD, NOW).interval_days, 3);
});

test("does not change the card passed in", () => {
  const card = { ...matureCard };
  schedule(card, GRADES.AGAIN, NOW);
  assert.deepEqual(card, matureCard);
});

test("rejects an unknown grade", () => {
  assert.throws(() => schedule(newCard, 4, NOW), RangeError);
  assert.throws(() => schedule(newCard, "2", NOW), RangeError);
});
