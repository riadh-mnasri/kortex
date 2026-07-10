/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Unit tests for XP, levels, streaks and heatmap bucketing.
 */
import { describe, expect, it } from "vitest";
import {
  computeStreak,
  heatLevel,
  heatmapCells,
  levelForXp,
  levelProgress,
  totalXpForLevel,
} from "@/lib/engine/gamification";

describe("levels", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("levels up at the documented thresholds", () => {
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(300);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });

  it("reports progress within the current level", () => {
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.current).toBe(50);
    expect(p.needed).toBe(200);
  });
});

describe("streak", () => {
  const TODAY = "2026-07-10";

  it("is 0 with no activity", () => {
    expect(computeStreak({}, TODAY)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const activity = {
      "2026-07-08": 3,
      "2026-07-09": 1,
      "2026-07-10": 2,
    };
    expect(computeStreak(activity, TODAY)).toBe(3);
  });

  it("keeps the flame alive if yesterday was active but today not yet", () => {
    const activity = { "2026-07-08": 1, "2026-07-09": 2 };
    expect(computeStreak(activity, TODAY)).toBe(2);
  });

  it("breaks on a missed day", () => {
    const activity = { "2026-07-07": 5, "2026-07-10": 1 };
    expect(computeStreak(activity, TODAY)).toBe(1);
  });
});

describe("heatmap", () => {
  it("produces weeks * 7 cells ending today", () => {
    const cells = heatmapCells({ "2026-07-10": 4 }, "2026-07-10", 4);
    expect(cells).toHaveLength(28);
    expect(cells[cells.length - 1]).toEqual({ day: "2026-07-10", count: 4 });
  });

  it("buckets counts into 5 intensity levels", () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(5)).toBe(2);
    expect(heatLevel(10)).toBe(3);
    expect(heatLevel(25)).toBe(4);
  });
});
