/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Progress store: the single source of truth for everything the learner
 * has done (XP, reviewed cards, completed lessons, exercises).
 *
 * Persistence strategy (see docs/adr/0003-sync-strategy.md):
 *   1. Every mutation is applied to React state and written to
 *      localStorage synchronously, so the app works fully offline.
 *   2. If a passphrase is configured, mutations are pushed to
 *      /api/progress (debounced). On startup the server copy is pulled
 *      and the most recently updated document wins.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  isDue,
  newCardState,
  review,
  toDayKey,
  type CardState,
  type Grade,
} from "./srs";
import { XP_RULES } from "./gamification";

export interface Progress {
  xp: number;
  /** Learning actions per local day, feeds the streak and the heatmap. */
  activity: Record<string, number>;
  /** SRS state per flashcard id. */
  cards: Record<string, CardState>;
  /** Completion date (day key) per lesson id. */
  lessonsDone: Record<string, string>;
  /** Best result per exercise id. */
  exercises: Record<string, { correct: boolean; at: string }>;
  /** Number of new cards the user wants to review per day. */
  dailyGoal: number;
  /** ISO timestamp of the last mutation, used for sync conflict resolution. */
  updatedAt: string;
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  activity: {},
  cards: {},
  lessonsDone: {},
  exercises: {},
  dailyGoal: 10,
  updatedAt: new Date(0).toISOString(),
};

const STORAGE_KEY = "kortex.progress.v1";
const PASSPHRASE_KEY = "kortex.passphrase";
const SYNC_DEBOUNCE_MS = 2500;

export type SyncStatus = "local" | "synced" | "error";

interface ProgressContextValue {
  progress: Progress;
  /** False until localStorage has been read; gate UI on it to avoid flicker. */
  ready: boolean;
  syncStatus: SyncStatus;
  reviewCard: (cardId: string, grade: Grade) => void;
  completeLesson: (lessonId: string) => void;
  answerExercise: (exerciseId: string, correct: boolean) => void;
  setDailyGoal: (goal: number) => void;
  getPassphrase: () => string;
  setPassphrase: (value: string) => Promise<boolean>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Startup: load the local copy, then reconcile with the server copy.
  useEffect(() => {
    const local = loadLocal();
    setProgress(local);
    setReady(true);

    const passphrase = window.localStorage.getItem(PASSPHRASE_KEY) ?? "";
    if (!passphrase) return;

    pullFromServer(passphrase).then((remote) => {
      if (remote && remote.updatedAt > local.updatedAt) {
        setProgress(remote);
        saveLocal(remote);
      } else if (remote !== null) {
        // Local copy is newer (or server is empty): push it.
        void pushToServer(passphrase, local).then((ok) =>
          setSyncStatus(ok ? "synced" : "error")
        );
        return;
      }
      setSyncStatus(remote ? "synced" : "error");
    });
  }, []);

  /** Applies a mutation, persists it locally and schedules a server push. */
  const mutate = useCallback((fn: (prev: Progress) => Progress) => {
    setProgress((prev) => {
      const next = { ...fn(prev), updatedAt: new Date().toISOString() };
      saveLocal(next);
      schedulePush(next);
      return next;
    });

    function schedulePush(next: Progress) {
      const passphrase = window.localStorage.getItem(PASSPHRASE_KEY) ?? "";
      if (!passphrase) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void pushToServer(passphrase, next).then((ok) =>
          setSyncStatus(ok ? "synced" : "error")
        );
      }, SYNC_DEBOUNCE_MS);
    }
  }, []);

  const bumpActivity = (activity: Record<string, number>) => {
    const today = toDayKey(new Date());
    return { ...activity, [today]: (activity[today] ?? 0) + 1 };
  };

  const reviewCard = useCallback(
    (cardId: string, grade: Grade) => {
      mutate((prev) => {
        const today = toDayKey(new Date());
        const state = prev.cards[cardId] ?? newCardState(today);
        const xpByGrade: Record<Grade, number> = {
          again: XP_RULES.reviewAgain,
          hard: XP_RULES.reviewHard,
          good: XP_RULES.reviewGood,
          easy: XP_RULES.reviewEasy,
        };
        return {
          ...prev,
          xp: prev.xp + xpByGrade[grade],
          cards: { ...prev.cards, [cardId]: review(state, grade, today) },
          activity: bumpActivity(prev.activity),
        };
      });
    },
    [mutate]
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      mutate((prev) => {
        if (prev.lessonsDone[lessonId]) return prev; // XP only once
        return {
          ...prev,
          xp: prev.xp + XP_RULES.lessonCompleted,
          lessonsDone: {
            ...prev.lessonsDone,
            [lessonId]: toDayKey(new Date()),
          },
          activity: bumpActivity(prev.activity),
        };
      });
    },
    [mutate]
  );

  const answerExercise = useCallback(
    (exerciseId: string, correct: boolean) => {
      mutate((prev) => {
        const previous = prev.exercises[exerciseId];
        return {
          ...prev,
          xp:
            prev.xp +
            (correct ? XP_RULES.exerciseCorrect : XP_RULES.exerciseWrong),
          exercises: {
            ...prev.exercises,
            [exerciseId]: {
              // A past success is never downgraded by a later miss.
              correct: correct || (previous?.correct ?? false),
              at: new Date().toISOString(),
            },
          },
          activity: bumpActivity(prev.activity),
        };
      });
    },
    [mutate]
  );

  const setDailyGoal = useCallback(
    (goal: number) => {
      mutate((prev) => ({ ...prev, dailyGoal: Math.max(1, goal) }));
    },
    [mutate]
  );

  const getPassphrase = useCallback(
    () => window.localStorage.getItem(PASSPHRASE_KEY) ?? "",
    []
  );

  /** Saves the passphrase and runs an immediate pull/push cycle. */
  const setPassphrase = useCallback(
    async (value: string): Promise<boolean> => {
      window.localStorage.setItem(PASSPHRASE_KEY, value);
      if (!value) {
        setSyncStatus("local");
        return true;
      }
      const local = loadLocal();
      const remote = await pullFromServer(value);
      if (remote === null) {
        setSyncStatus("error");
        return false;
      }
      if (remote.updatedAt > local.updatedAt) {
        setProgress(remote);
        saveLocal(remote);
        setSyncStatus("synced");
        return true;
      }
      const ok = await pushToServer(value, local);
      setSyncStatus(ok ? "synced" : "error");
      return ok;
    },
    []
  );

  return (
    <ProgressContext.Provider
      value={{
        progress,
        ready,
        syncStatus,
        reviewCard,
        completeLesson,
        answerExercise,
        setDailyGoal,
        getPassphrase,
        setPassphrase,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

/** Ids of the flashcards due today, given the full card catalog. */
export function dueCardIds(
  progress: Progress,
  allCardIds: string[],
  today: string = toDayKey(new Date())
): string[] {
  const seen: string[] = [];
  const fresh: string[] = [];
  for (const id of allCardIds) {
    const state = progress.cards[id];
    if (!state) fresh.push(id);
    else if (isDue(state, today)) seen.push(id);
  }
  // Due reviews first, then new cards up to the daily goal.
  const newToday = Object.values(progress.cards).filter(
    (c) => c.reviews > 0 && c.due >= today && c.box <= 1
  ).length;
  const budget = Math.max(0, progress.dailyGoal - newToday);
  return [...seen, ...fresh.slice(0, budget)];
}

function loadLocal(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    return { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Progress) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function saveLocal(progress: Progress): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Returns the server document, EMPTY_PROGRESS when none, null on failure. */
async function pullFromServer(passphrase: string): Promise<Progress | null> {
  try {
    const res = await fetch("/api/progress", {
      headers: { "x-kortex-passphrase": passphrase },
    });
    if (res.status === 404) return EMPTY_PROGRESS;
    if (!res.ok) return null;
    return (await res.json()) as Progress;
  } catch {
    return null;
  }
}

async function pushToServer(
  passphrase: string,
  progress: Progress
): Promise<boolean> {
  try {
    const res = await fetch("/api/progress", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-kortex-passphrase": passphrase,
      },
      body: JSON.stringify(progress),
    });
    return res.ok;
  } catch {
    return false;
  }
}
