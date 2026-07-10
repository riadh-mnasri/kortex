/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Module overview: lesson list with completion state, entry points to
 * the review session and the exercise runner.
 */
"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { useProgress } from "@/lib/engine/progress";
import { getModule } from "@/lib/content";
import { pick } from "@/lib/content/types";

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const { progress } = useProgress();

  const mod = getModule(id);
  if (!mod) notFound();

  const correctExercises = mod.exercises.filter(
    (e) => progress.exercises[e.id]?.correct
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <span className="text-4xl">{mod.icon}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pick(mod.title, locale)}
          </h1>
          <p className="text-muted">{pick(mod.tagline, locale)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/review"
          className="px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          🃏 {t("module.startReview")}
        </Link>
        <Link
          href={`/module/${mod.id}/exercises`}
          className="px-4 py-2 rounded-xl border border-border bg-surface font-medium hover:border-accent transition-colors"
        >
          🧪 {t("module.exercises")} ({correctExercises}/{mod.exercises.length})
        </Link>
      </div>

      <section>
        <h2 className="font-semibold mb-3">{t("module.lessons")}</h2>
        <ol className="space-y-2">
          {mod.lessons.map((lesson, index) => {
            const done = Boolean(progress.lessonsDone[lesson.id]);
            return (
              <li key={lesson.id}>
                <Link
                  href={`/module/${mod.id}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 hover:border-accent transition-colors"
                >
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                      done
                        ? "bg-teal-soft text-teal"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{pick(lesson.title, locale)}</h3>
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {lesson.minutes} {t("module.minutes")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
