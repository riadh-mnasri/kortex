/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Content model shared by the learning engine and the content packs.
 *
 * The engine is content-agnostic: it only knows about these shapes.
 * A "content pack" (Kotlin today, Rust or GCP tomorrow) is a folder of
 * JSON files that conform to this model. See content/packs/kotlin.
 */

/** A string available in both supported locales. */
export interface L10n {
  en: string;
  fr: string;
}

export type Locale = keyof L10n;

/** Picks the right translation for the active locale. */
export function pick(text: L10n, locale: Locale): string {
  return text[locale];
}

/**
 * A lesson is a sequence of typed blocks. Keeping blocks structured
 * (instead of raw markdown) lets the UI style tips and gotchas
 * distinctly and keeps content portable across packs.
 */
export type LessonBlock =
  | { type: "text"; body: L10n }
  | { type: "code"; code: string; caption?: L10n }
  | { type: "tip"; body: L10n }
  | { type: "gotcha"; body: L10n };

export interface Lesson {
  id: string;
  title: L10n;
  /** Estimated reading time in minutes, shown in the UI. */
  minutes: number;
  blocks: LessonBlock[];
}

/** A flashcard reviewed with spaced repetition (see lib/engine/srs.ts). */
export interface Flashcard {
  id: string;
  front: L10n;
  back: L10n;
  /** Optional code snippet displayed on the front side. */
  code?: string;
}

export type ExerciseKind = "mcq" | "predict-output" | "find-bug";

export interface ExerciseChoice {
  id: string;
  label: L10n;
}

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  prompt: L10n;
  /** Code the question refers to (required for predict-output and find-bug). */
  code?: string;
  choices: ExerciseChoice[];
  answerId: string;
  explanation: L10n;
  difficulty: 1 | 2 | 3;
}

export interface Module {
  id: string;
  title: L10n;
  tagline: L10n;
  /** Emoji used as a lightweight icon in the UI. */
  icon: string;
  lessons: Lesson[];
  flashcards: Flashcard[];
  exercises: Exercise[];
}

/** Entry in the pack manifest. Planned modules appear locked in the UI. */
export interface ModuleRef {
  id: string;
  title: L10n;
  tagline: L10n;
  icon: string;
  status: "available" | "planned";
}

export interface Pack {
  id: string;
  name: string;
  /** Version of the target technology covered (e.g. Kotlin version). */
  targetVersion: string;
  modules: ModuleRef[];
}
