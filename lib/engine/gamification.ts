/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Gamification engine: XP, levels, streaks and activity heatmap.
 *
 * Rewards are strictly virtual (XP, levels, badges). The XP scale favors
 * frequency over volume: coming back every day beats binge sessions.
 */

import { toDayKey } from "./srs";

/** XP granted per action. Reviewing honestly ("again") still earns XP. */
export const XP_RULES = {
  reviewAgain: 1,
  reviewHard: 3,
  reviewGood: 5,
  reviewEasy: 5,
  exerciseCorrect: 10,
  exerciseWrong: 2,
  lessonCompleted: 15,
} as const;

/**
 * XP needed to go from level n to level n+1 grows linearly:
 * level 1 -> 2 costs 100 XP, level 2 -> 3 costs 200 XP, etc.
 * Total XP to reach level n is therefore 100 * n * (n - 1) / 2.
 */
export function totalXpForLevel(level: number): number {
  return (100 * level * (level - 1)) / 2;
}

/** Current level for a given XP amount (level 1 at 0 XP). */
export function levelForXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level++;
  return level;
}

/** Progress within the current level, for the XP progress bar. */
export function levelProgress(xp: number): {
  level: number;
  current: number;
  needed: number;
} {
  const level = levelForXp(xp);
  const floor = totalXpForLevel(level);
  const ceil = totalXpForLevel(level + 1);
  return { level, current: xp - floor, needed: ceil - floor };
}

/** Map of local day (YYYY-MM-DD) to number of learning actions that day. */
export type ActivityLog = Record<string, number>;

/**
 * Current streak in days. Counts consecutive active days ending today,
 * or ending yesterday (an active yesterday keeps the flame alive until
 * the end of today, so the streak does not read as broken at breakfast).
 */
export function computeStreak(activity: ActivityLog, today: string): number {
  const active = (day: string) => (activity[day] ?? 0) > 0;

  const yesterday = shiftDay(today, -1);
  let cursor = active(today) ? today : active(yesterday) ? yesterday : null;
  if (!cursor) return 0;

  let streak = 0;
  while (active(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

/** Cells for a GitHub-style heatmap covering the last `weeks` full weeks. */
export function heatmapCells(
  activity: ActivityLog,
  today: string,
  weeks = 16
): { day: string; count: number }[] {
  const cells: { day: string; count: number }[] = [];
  const days = weeks * 7;
  for (let i = days - 1; i >= 0; i--) {
    const day = shiftDay(today, -i);
    cells.push({ day, count: activity[day] ?? 0 });
  }
  return cells;
}

/** Intensity bucket (0 to 4) used to pick a heatmap color. */
export function heatLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 4) return 1;
  if (count <= 9) return 2;
  if (count <= 19) return 3;
  return 4;
}

function shiftDay(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDayKey(date);
}
