/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Sticky application header: brand, navigation, live streak and due-cards
 * badges, language and theme toggles.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { useProgress } from "@/lib/engine/progress";
import { computeStreak } from "@/lib/engine/gamification";
import { dueCardIds } from "@/lib/engine/progress";
import { allCardIds } from "@/lib/content";
import { toDayKey } from "@/lib/engine/srs";

export function AppHeader() {
  const { t, locale, setLocale } = useLocale();
  const { progress, ready } = useProgress();
  const pathname = usePathname();

  const today = toDayKey(new Date());
  const streak = ready ? computeStreak(progress.activity, today) : 0;
  const due = ready ? dueCardIds(progress, allCardIds(), today).length : 0;

  const nav = [
    { href: "/", label: t("nav.dashboard") },
    { href: "/review", label: t("nav.review") },
    { href: "/settings", label: t("nav.settings") },
  ];

  const toggleTheme = () => {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("kortex.theme", next);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-white font-mono font-bold text-sm">
            K
          </span>
          <span className="font-semibold tracking-tight">
            Korte<span className="text-accent">x</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-surface-2 font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {streak > 0 && (
            <span
              title={t("stats.streak")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-soft text-accent font-semibold"
            >
              🔥 {streak}
            </span>
          )}
          {due > 0 && (
            <Link
              href="/review"
              title={t("stats.due")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-soft text-teal font-semibold"
            >
              🃏 {due}
            </Link>
          )}
          <button
            onClick={() => setLocale(locale === "en" ? "fr" : "en")}
            className="px-2 py-1 rounded-lg border border-border text-muted hover:text-foreground font-mono text-xs uppercase"
            title="Language / Langue"
          >
            {locale}
          </button>
          <button
            onClick={toggleTheme}
            className="px-2 py-1 rounded-lg border border-border text-muted hover:text-foreground"
            title="Theme"
          >
            ◐
          </button>
        </div>
      </div>
    </header>
  );
}
