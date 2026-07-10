/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Content pack loader.
 *
 * The active pack is resolved at build time through static imports, so
 * the whole catalog ships with the app and works offline. To create a
 * new learning app (Rust, GCP, ...), add a pack folder and swap the
 * imports below; nothing else in the codebase references Kotlin.
 */

import type { Module, ModuleRef, Pack } from "./types";
import packManifest from "@/content/packs/kotlin/pack.json";
import basics from "@/content/packs/kotlin/modules/basics.json";
import functions from "@/content/packs/kotlin/modules/functions.json";
import coroutines from "@/content/packs/kotlin/modules/coroutines.json";

export const pack = packManifest as unknown as Pack;

/** Available modules, keyed by id. Planned modules have no content yet. */
const modules: Record<string, Module> = {
  [basics.id]: basics as unknown as Module,
  [functions.id]: functions as unknown as Module,
  [coroutines.id]: coroutines as unknown as Module,
};

export function getModule(id: string): Module | undefined {
  return modules[id];
}

export function availableModules(): Module[] {
  return pack.modules
    .filter((ref) => ref.status === "available")
    .map((ref) => modules[ref.id])
    .filter((m): m is Module => m !== undefined);
}

export function moduleRefs(): ModuleRef[] {
  return pack.modules;
}

/** Every flashcard id in the pack, used to compute the due queue. */
export function allCardIds(): string[] {
  return availableModules().flatMap((m) => m.flashcards.map((c) => c.id));
}

/** Total content items and completed items, for the coverage stat. */
export function coverage(
  lessonsDone: Record<string, string>,
  cards: Record<string, { box: number }>,
  exercises: Record<string, { correct: boolean }>
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const m of availableModules()) {
    total += m.lessons.length + m.flashcards.length + m.exercises.length;
    done += m.lessons.filter((l) => lessonsDone[l.id]).length;
    // A card counts as covered once it has climbed out of the first boxes.
    done += m.flashcards.filter((c) => (cards[c.id]?.box ?? 0) >= 2).length;
    done += m.exercises.filter((e) => exercises[e.id]?.correct).length;
  }
  return { done, total };
}
