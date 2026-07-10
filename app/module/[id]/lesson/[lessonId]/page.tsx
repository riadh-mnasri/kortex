/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Lesson reader: renders the typed content blocks and lets the learner
 * mark the lesson as completed (XP granted once).
 */
"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { useProgress } from "@/lib/engine/progress";
import { getModule } from "@/lib/content";
import { pick } from "@/lib/content/types";
import { CodeBlock } from "@/components/CodeBlock";

export default function LessonPage() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const { t, locale } = useLocale();
  const { progress, completeLesson } = useProgress();

  const mod = getModule(id);
  const lessonIndex = mod?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  if (!mod || lessonIndex === -1) notFound();

  const lesson = mod.lessons[lessonIndex];
  const next = mod.lessons[lessonIndex + 1];
  const done = Boolean(progress.lessonsDone[lesson.id]);

  return (
    <article className="max-w-2xl mx-auto space-y-4">
      <Link
        href={`/module/${mod.id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {t("lesson.backToModule")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">
        {pick(lesson.title, locale)}
      </h1>

      <div className="space-y-4 leading-relaxed">
        {lesson.blocks.map((block, i) => {
          switch (block.type) {
            case "text":
              return <Paragraph key={i} text={pick(block.body, locale)} />;
            case "code":
              return (
                <CodeBlock
                  key={i}
                  code={block.code}
                  caption={block.caption && pick(block.caption, locale)}
                />
              );
            case "tip":
              return (
                <Callout key={i} tone="tip" title={t("lesson.tip")}>
                  {pick(block.body, locale)}
                </Callout>
              );
            case "gotcha":
              return (
                <Callout key={i} tone="gotcha" title={t("lesson.gotcha")}>
                  {pick(block.body, locale)}
                </Callout>
              );
          }
        })}
      </div>

      <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-border">
        {done ? (
          <span className="px-4 py-2 rounded-xl bg-teal-soft text-teal font-medium">
            ✓ {t("lesson.completed")}
          </span>
        ) : (
          <button
            onClick={() => completeLesson(lesson.id)}
            className="px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            {t("lesson.markDone")}
          </button>
        )}
        {next && (
          <Link
            href={`/module/${mod.id}/lesson/${next.id}`}
            className="px-4 py-2 rounded-xl border border-border bg-surface font-medium hover:border-accent transition-colors"
          >
            {t("lesson.next")} →
          </Link>
        )}
      </div>
    </article>
  );
}

/** Renders a paragraph, styling `inline code` spans in monospace. */
function Paragraph({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-surface-2 text-[0.85em] text-accent"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "tip" | "gotcha";
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "tip"
      ? "border-teal/40 bg-teal-soft"
      : "border-accent/40 bg-accent-soft";
  const icon = tone === "tip" ? "💡" : "⚠️";
  return (
    <aside className={`rounded-xl border p-4 text-sm ${styles}`}>
      <div className="font-semibold mb-1">
        {icon} {title}
      </div>
      <Paragraph text={String(children)} />
    </aside>
  );
}
