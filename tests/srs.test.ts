/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Unit tests for the Leitner spaced repetition engine.
 */
import { describe, expect, it } from "vitest";
import {
  addDays,
  BOX_INTERVALS_DAYS,
  isDue,
  isMastered,
  MAX_BOX,
  newCardState,
  review,
  toDayKey,
} from "@/lib/engine/srs";

const TODAY = "2026-07-10";

describe("newCardState", () => {
  it("starts in box 0, due immediately", () => {
    const state = newCardState(TODAY);
    expect(state.box).toBe(0);
    expect(isDue(state, TODAY)).toBe(true);
    expect(state.reviews).toBe(0);
  });
});

describe("review grading", () => {
  it("good moves the card up one box and schedules the box interval", () => {
    const next = review(newCardState(TODAY), "good", TODAY);
    expect(next.box).toBe(1);
    expect(next.due).toBe(addDays(TODAY, BOX_INTERVALS_DAYS[1]));
    expect(next.reviews).toBe(1);
  });

  it("easy jumps two boxes", () => {
    const next = review(newCardState(TODAY), "easy", TODAY);
    expect(next.box).toBe(2);
    expect(next.due).toBe(addDays(TODAY, BOX_INTERVALS_DAYS[2]));
  });

  it("again sends the card back to box 0, due today", () => {
    const inBox3 = { box: 3, due: TODAY, reviews: 5 };
    const next = review(inBox3, "again", TODAY);
    expect(next.box).toBe(0);
    expect(next.due).toBe(TODAY);
    expect(isDue(next, TODAY)).toBe(true);
  });

  it("hard keeps the box but halves the interval (minimum one day)", () => {
    const inBox3 = { box: 3, due: TODAY, reviews: 5 };
    const next = review(inBox3, "hard", TODAY);
    expect(next.box).toBe(3);
    expect(next.due).toBe(addDays(TODAY, 3)); // floor(7 / 2)
  });

  it("never exceeds the last box", () => {
    const top = { box: MAX_BOX, due: TODAY, reviews: 10 };
    expect(review(top, "good", TODAY).box).toBe(MAX_BOX);
    expect(review(top, "easy", TODAY).box).toBe(MAX_BOX);
  });
});

describe("mastery", () => {
  it("a card is mastered in the last box only", () => {
    expect(isMastered({ box: MAX_BOX, due: TODAY, reviews: 4 })).toBe(true);
    expect(isMastered({ box: MAX_BOX - 1, due: TODAY, reviews: 4 })).toBe(false);
  });
});

describe("day helpers", () => {
  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("toDayKey formats with zero padding", () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
