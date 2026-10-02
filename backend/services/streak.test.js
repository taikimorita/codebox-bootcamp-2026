import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStreak } from "./streak.js";

test("no reviews means no streak", () => {
  assert.deepEqual(computeStreak([], "2026-10-01"), {
    days: 0,
    reviewed_today: false,
  });
});

test("counts consecutive days ending today", () => {
  const days = ["2026-10-01", "2026-09-30", "2026-09-29"];
  assert.deepEqual(computeStreak(days, "2026-10-01"), {
    days: 3,
    reviewed_today: true,
  });
});

test("a streak ending yesterday is still alive today", () => {
  const days = ["2026-09-30", "2026-09-29"];
  assert.deepEqual(computeStreak(days, "2026-10-01"), {
    days: 2,
    reviewed_today: false,
  });
});

test("a gap of a whole day breaks the streak", () => {
  assert.equal(computeStreak(["2026-09-29"], "2026-10-01").days, 0);
  // Today plus an older run: only today counts
  assert.equal(
    computeStreak(["2026-10-01", "2026-09-29", "2026-09-28"], "2026-10-01")
      .days,
    1,
  );
});

test("crosses month and year boundaries", () => {
  const days = ["2027-01-01", "2026-12-31", "2026-12-30"];
  assert.equal(computeStreak(days, "2027-01-01").days, 3);
  assert.equal(computeStreak(["2026-03-01", "2026-02-28"], "2026-03-01").days, 2);
});

test("ignores order and duplicates", () => {
  const days = ["2026-09-30", "2026-10-01", "2026-09-30"];
  assert.equal(computeStreak(days, "2026-10-01").days, 2);
});
