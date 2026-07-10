/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Flashcard review session over all due cards of the pack.
 *
 * Keyboard driven for speed: Space flips the card, keys 1 to 4 grade it
 * (again / hard / good / easy). Cards graded "again" are re-queued at
 * the end of the same session.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useProgress, dueCardIds } from "@/lib/engine/progress";
import { toDayKey, type Grade } from "@/lib/engine/srs";
import { XP_RULES } from "@/lib/engine/gamification";
import { availableModules } from "@/lib/content";
import { pick, type Flashcard } from "@/lib/content/types";
import { CodeBlock } from "@/components/CodeBlock";

const GRADES: { grade: Grade; key: string; labelKey: "review.again" | "review.hard" | "review.good" | "review.easy"; xp: number; classes: string }[] = [
  { grade: "again", key: "1", labelKey: "review.again", xp: XP_RULES.reviewAgain, classes: "border-danger/50 hover:bg-danger/10 text-danger" },
  { grade: "hard", key: "2", labelKey: "review.hard", xp: XP_RULES.reviewHard, classes: "border-gold/50 hover:bg-gold/10 text-gold" },
  { grade: "good", key: "3", labelKey: "review.good", xp: XP_RULES.reviewGood, classes: "border-teal/50 hover:bg-teal/10 text-teal" },
  { grade: "easy", key: "4", labelKey: "review.easy", xp: XP_RULES.reviewEasy, classes: "border-accent/50 hover:bg-accent/10 text-accent" },
];

export default function ReviewPage() {
  const { t, locale } = useLocale();
  const { progress, ready, reviewCard } = useProgress();

  // The queue is computed once when the page becomes ready, then managed
  // locally: recomputing from `progress` after each grade would make the
  // just-reviewed card pop in and out and shuffle the session.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const cardsById = useMemo(() => {
    const map = new Map<string, Flashcard>();
    for (const mod of availableModules())
      for (const card of mod.flashcards) map.set(card.id, card);
    return map;
  }, []);

  useEffect(() => {
    if (ready && queue === null) {
      const ids = dueCardIds(progress, [...cardsById.keys()], toDayKey(new Date()));
      setQueue(ids);
    }
  }, [ready, queue, progress, cardsById]);

  const currentId = queue?.[0];
  const card = currentId ? cardsById.get(currentId) : undefined;

  const grade = useCallback(
    (g: Grade) => {
      if (!currentId || !flipped) return;
      reviewCard(currentId, g);
      setXpEarned((xp) => xp + GRADES.find((x) => x.grade === g)!.xp);
      setReviewed((n) => n + 1);
      setFlipped(false);
      setQueue((q) => {
        if (!q) return q;
        const [head, ...rest] = q;
        // "again" re-queues the card at the end of the session.
        return g === "again" ? [...rest, head] : rest;
      });
    },
    [currentId, flipped, reviewCard]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped(true);
      }
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx !== -1) grade(GRADES[idx].grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grade]);

  if (!ready || queue === null) return null;

  // Session finished (or nothing was due)
  if (!card) {
    return (
      <div className="max-w-md mx-auto text-center pt-16 space-y-4 pop-in">
        <div className="text-5xl">{reviewed > 0 ? "🎉" : "😌"}</div>
        <h1 className="text-2xl font-bold">
          {reviewed > 0 ? t("review.done.title") : t("review.empty.title")}
        </h1>
        {reviewed > 0 ? (
          <p className="text-muted">
            {reviewed} {t("review.done.body")} · +{xpEarned}{" "}
            {t("review.done.xp")}
          </p>
        ) : (
          <p className="text-muted">{t("review.empty.body")}</p>
        )}
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90"
        >
          {t("review.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <h1 className="font-semibold text-foreground">{t("review.title")}</h1>
        <span>
          {queue.length} {t("review.remaining")}
        </span>
      </div>

      {/* Card */}
      <div
        className={`flip-card cursor-pointer select-none ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(true)}
      >
        <div className="flip-card-inner relative min-h-72">
          <div className="flip-face absolute inset-0 rounded-2xl border border-border bg-surface p-8 flex flex-col">
            <div className="text-lg font-medium leading-relaxed">
              {pick(card.front, locale)}
            </div>
            {card.code && <CodeBlock code={card.code} />}
            <div className="mt-auto pt-6 text-center text-sm text-muted">
              {t("review.showAnswer")} (Space)
            </div>
          </div>
          <div className="flip-face flip-back absolute inset-0 rounded-2xl border border-accent/40 bg-surface p-8 overflow-y-auto">
            <div className="leading-relaxed">{pick(card.back, locale)}</div>
          </div>
        </div>
      </div>

      {/* Grading buttons */}
      <div
        className={`grid grid-cols-4 gap-2 transition-opacity ${
          flipped ? "opacity-100" : "opacity-30 pointer-events-none"
        }`}
      >
        {GRADES.map((g) => (
          <button
            key={g.grade}
            onClick={() => grade(g.grade)}
            className={`rounded-xl border bg-surface px-2 py-3 font-medium transition-colors ${g.classes}`}
          >
            <div>{t(g.labelKey)}</div>
            <div className="text-xs opacity-70 font-mono">{g.key}</div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted">{t("review.keyboardHint")}</p>
    </div>
  );
}
