/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Exercise runner: one exercise at a time, immediate feedback with an
 * explanation, score screen at the end.
 */
"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useProgress } from "@/lib/engine/progress";
import { getModule } from "@/lib/content";
import { pick } from "@/lib/content/types";
import { CodeBlock } from "@/components/CodeBlock";

export default function ExercisesPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const { answerExercise } = useProgress();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const mod = getModule(id);
  if (!mod) notFound();

  const exercise = mod.exercises[index];

  // End screen
  if (!exercise) {
    return (
      <div className="max-w-md mx-auto text-center pt-16 space-y-4 pop-in">
        <div className="text-5xl">{score === mod.exercises.length ? "🏆" : "🎉"}</div>
        <h1 className="text-2xl font-bold">{t("exercise.finish.title")}</h1>
        <p className="text-muted">
          {score} {t("common.of")} {mod.exercises.length}{" "}
          {t("exercise.finish.score")}
        </p>
        <Link
          href={`/module/${mod.id}`}
          className="inline-block px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90"
        >
          {t("lesson.backToModule")}
        </Link>
      </div>
    );
  }

  const correct = checked && selected === exercise.answerId;

  const check = () => {
    if (!selected || checked) return;
    const isCorrect = selected === exercise.answerId;
    setChecked(true);
    if (isCorrect) setScore((s) => s + 1);
    answerExercise(exercise.id, isCorrect);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="px-2 py-0.5 rounded-full bg-surface-2 font-medium text-foreground">
          {t(`exercise.kind.${exercise.kind}`)}
        </span>
        <span>
          {index + 1} / {mod.exercises.length} ·{" "}
          {t("exercise.difficulty")} {"●".repeat(exercise.difficulty)}
          {"○".repeat(3 - exercise.difficulty)}
        </span>
      </div>

      <h1 className="text-lg font-semibold leading-relaxed">
        {pick(exercise.prompt, locale)}
      </h1>

      {exercise.code && <CodeBlock code={exercise.code} />}

      <div className="space-y-2">
        {exercise.choices.map((choice) => {
          const isAnswer = choice.id === exercise.answerId;
          const isSelected = choice.id === selected;
          let classes = "border-border bg-surface hover:border-accent";
          if (checked && isAnswer) classes = "border-teal bg-teal-soft";
          else if (checked && isSelected) classes = "border-danger bg-danger/10";
          else if (isSelected) classes = "border-accent bg-accent-soft";
          return (
            <button
              key={choice.id}
              disabled={checked}
              onClick={() => setSelected(choice.id)}
              className={`w-full text-left rounded-xl border p-3.5 transition-colors disabled:cursor-default ${classes}`}
            >
              {pick(choice.label, locale)}
            </button>
          );
        })}
      </div>

      {checked && (
        <div
          className={`rounded-xl border p-4 text-sm pop-in ${
            correct
              ? "border-teal/40 bg-teal-soft"
              : "border-danger/40 bg-danger/10"
          }`}
        >
          <div className="font-semibold mb-1">
            {correct ? `✓ ${t("exercise.correct")}` : `✗ ${t("exercise.wrong")}`}
          </div>
          <p className="leading-relaxed">{pick(exercise.explanation, locale)}</p>
        </div>
      )}

      <div className="flex justify-end">
        {checked ? (
          <button
            onClick={next}
            className="px-5 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90"
          >
            {t("exercise.next")} →
          </button>
        ) : (
          <button
            onClick={check}
            disabled={!selected}
            className="px-5 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 disabled:opacity-40"
          >
            {t("exercise.check")}
          </button>
        )}
      </div>
    </div>
  );
}
