/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Dashboard: daily stats, activity heatmap and the module catalog.
 */
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { useProgress, dueCardIds } from "@/lib/engine/progress";
import { computeStreak, levelProgress } from "@/lib/engine/gamification";
import { toDayKey } from "@/lib/engine/srs";
import { allCardIds, coverage, getModule, moduleRefs } from "@/lib/content";
import { pick } from "@/lib/content/types";
import { Heatmap } from "@/components/Heatmap";

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const { progress, ready } = useProgress();

  const today = toDayKey(new Date());
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greeting.morning")
      : hour < 18
        ? t("dashboard.greeting.afternoon")
        : t("dashboard.greeting.evening");

  const streak = computeStreak(progress.activity, today);
  const { level, current, needed } = levelProgress(progress.xp);
  const due = dueCardIds(progress, allCardIds(), today).length;
  const cov = coverage(progress.lessonsDone, progress.cards, progress.exercises);
  const covPct = cov.total === 0 ? 0 : Math.round((cov.done / cov.total) * 100);

  if (!ready) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, Riadh 👋
        </h1>
        <p className="text-muted mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="🔥" label={t("stats.streak")} value={String(streak)} />
        <StatCard
          icon="⭐"
          label={`${t("stats.level")} ${level}`}
          value={`${current}/${needed} ${t("stats.xp")}`}
          progress={needed === 0 ? 0 : current / needed}
        />
        <StatCard
          icon="🃏"
          label={t("stats.due")}
          value={String(due)}
          href="/review"
          highlight={due > 0}
        />
        <StatCard
          icon="📈"
          label={t("stats.coverage")}
          value={`${covPct}%`}
          progress={covPct / 100}
        />
      </div>

      {/* Heatmap */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold mb-4">{t("heatmap.title")}</h2>
        <Heatmap activity={progress.activity} today={today} />
      </section>

      {/* Modules */}
      <section>
        <h2 className="font-semibold mb-4">{t("modules.title")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {moduleRefs().map((ref) => {
            const mod = getModule(ref.id);
            const lessonsDone = mod
              ? mod.lessons.filter((l) => progress.lessonsDone[l.id]).length
              : 0;
            return mod && ref.status === "available" ? (
              <Link
                key={ref.id}
                href={`/module/${ref.id}`}
                className="group rounded-2xl border border-border bg-surface p-5 hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ref.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold group-hover:text-accent transition-colors">
                      {pick(ref.title, locale)}
                    </h3>
                    <p className="text-sm text-muted truncate">
                      {pick(ref.tagline, locale)}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      {lessonsDone}/{mod.lessons.length} {t("modules.lessons")}{" "}
                      · {mod.flashcards.length} {t("modules.cards")} ·{" "}
                      {mod.exercises.length} {t("modules.exercises")}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={ref.id}
                className="rounded-2xl border border-dashed border-border p-5 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl grayscale">{ref.icon}</span>
                  <div>
                    <h3 className="font-semibold">{pick(ref.title, locale)}</h3>
                    <p className="text-sm text-muted">
                      {pick(ref.tagline, locale)}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                      {t("modules.planned")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  progress,
  href,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  progress?: number;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <div
      className={`rounded-2xl border p-4 h-full bg-surface transition-colors ${
        highlight ? "border-accent" : "border-border"
      } ${href ? "hover:border-accent" : ""}`}
    >
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight">{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
