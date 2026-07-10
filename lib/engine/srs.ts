/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Spaced repetition engine (Leitner system, 5 boxes).
 *
 * Every flashcard lives in a box from 0 to 4. Each box maps to a review
 * interval in days: the higher the box, the rarer the reviews. Grading a
 * card moves it between boxes:
 *
 *   again -> back to box 0, card is re-queued in the current session
 *   hard  -> stays in its box, shorter interval
 *   good  -> moves up one box
 *   easy  -> jumps two boxes
 *
 * The model is deliberately simpler than SM-2: with a single expert user
 * and short daily sessions, Leitner gives predictable scheduling and is
 * trivial to reason about. See docs/adr/0002-leitner-over-sm2.md.
 */

/** Review intervals in days, indexed by box. Box 0 means "due immediately". */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14] as const;

export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  /** Leitner box, 0 (new / relearning) to 4 (mastered). */
  box: number;
  /** ISO date (YYYY-MM-DD) from which the card is due again. */
  due: string;
  /** ISO timestamp of the last review, absent for brand new cards. */
  lastReviewedAt?: string;
  /** Total number of reviews, used for stats. */
  reviews: number;
}

/** State given to a card the first time it is encountered. */
export function newCardState(today: string): CardState {
  return { box: 0, due: today, reviews: 0 };
}

/** Formats a Date as a local YYYY-MM-DD key. All scheduling uses local days. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the day key `days` days after the given day key. */
export function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

/** A card is due when its due date is today or in the past. */
export function isDue(state: CardState, today: string): boolean {
  return state.due <= today;
}

/**
 * Applies a grade to a card and returns its next state.
 * Pure function: callers own persistence and clocks, which keeps it
 * fully unit-testable.
 */
export function review(
  state: CardState,
  grade: Grade,
  today: string,
  now: Date = new Date()
): CardState {
  let box: number;
  switch (grade) {
    case "again":
      box = 0;
      break;
    case "hard":
      box = state.box;
      break;
    case "good":
      box = Math.min(state.box + 1, MAX_BOX);
      break;
    case "easy":
      box = Math.min(state.box + 2, MAX_BOX);
      break;
  }

  // "hard" keeps the box but halves the wait (at least one day) so the
  // card comes back sooner without being demoted.
  const interval =
    grade === "hard"
      ? Math.max(1, Math.floor(BOX_INTERVALS_DAYS[box] / 2))
      : BOX_INTERVALS_DAYS[box];

  return {
    box,
    due: addDays(today, interval),
    lastReviewedAt: now.toISOString(),
    reviews: state.reviews + 1,
  };
}

/** A card is considered mastered once it reaches the last box. */
export function isMastered(state: CardState): boolean {
  return state.box >= MAX_BOX;
}
