/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * GitHub-style activity heatmap: one cell per day, columns are weeks.
 */
"use client";

import { heatLevel, heatmapCells } from "@/lib/engine/gamification";
import type { ActivityLog } from "@/lib/engine/gamification";
import { useLocale } from "@/lib/i18n";

const HEAT_VARS = [
  "var(--heat-0)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
];

export function Heatmap({
  activity,
  today,
  weeks = 16,
}: {
  activity: ActivityLog;
  today: string;
  weeks?: number;
}) {
  const { t } = useLocale();
  const cells = heatmapCells(activity, today, weeks);

  // Column-major grid: 7 rows (days), `weeks` columns.
  const columns: (typeof cells)[] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, w * 7 + 7));
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.day}
                title={`${cell.day}: ${cell.count}`}
                className="w-3 h-3 rounded-[3px]"
                style={{ background: HEAT_VARS[heatLevel(cell.count)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted justify-end">
        <span>{t("heatmap.legend.less")}</span>
        {HEAT_VARS.map((color) => (
          <span
            key={color}
            className="w-3 h-3 rounded-[3px] inline-block"
            style={{ background: color }}
          />
        ))}
        <span>{t("heatmap.legend.more")}</span>
      </div>
    </div>
  );
}
