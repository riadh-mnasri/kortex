/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Settings: language, theme, daily goal and cross-device sync.
 */
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useProgress } from "@/lib/engine/progress";
import type { Locale } from "@/lib/content/types";

type ThemePref = "light" | "dark" | "system";

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const { progress, syncStatus, setDailyGoal, getPassphrase, setPassphrase } =
    useProgress();

  const [theme, setTheme] = useState<ThemePref>("system");
  const [passphrase, setPassphraseInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("kortex.theme") as ThemePref;
    if (saved) setTheme(saved);
    setPassphraseInput(getPassphrase());
  }, [getPassphrase]);

  const applyTheme = (pref: ThemePref) => {
    setTheme(pref);
    window.localStorage.setItem("kortex.theme", pref);
    const dark =
      pref === "dark" ||
      (pref === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  };

  const saveSync = async () => {
    setSaving(true);
    await setPassphrase(passphrase.trim());
    setSaving(false);
  };

  const statusBadge = {
    synced: { label: t("settings.sync.status.synced"), classes: "bg-teal-soft text-teal" },
    local: { label: t("settings.sync.status.local"), classes: "bg-surface-2 text-muted" },
    error: { label: t("settings.sync.status.error"), classes: "bg-danger/10 text-danger" },
  }[syncStatus];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>

      <Section title={t("settings.language")}>
        <div className="flex gap-2">
          {(["en", "fr"] as Locale[]).map((l) => (
            <Chip key={l} active={locale === l} onClick={() => setLocale(l)}>
              {l === "en" ? "English" : "Français"}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t("settings.theme")}>
        <div className="flex gap-2">
          {(
            [
              ["light", t("settings.theme.light")],
              ["dark", t("settings.theme.dark")],
              ["system", t("settings.theme.system")],
            ] as [ThemePref, string][]
          ).map(([pref, label]) => (
            <Chip key={pref} active={theme === pref} onClick={() => applyTheme(pref)}>
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t("settings.dailyGoal")}>
        <input
          type="number"
          min={1}
          max={100}
          value={progress.dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          className="w-24 rounded-xl border border-border bg-surface px-3 py-2"
        />
      </Section>

      <Section
        title={t("settings.sync.title")}
        badge={
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.classes}`}>
            {statusBadge.label}
          </span>
        }
      >
        <p className="text-sm text-muted mb-3">{t("settings.sync.body")}</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphraseInput(e.target.value)}
            placeholder={t("settings.sync.placeholder")}
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2"
          />
          <button
            onClick={saveSync}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {t("settings.sync.save")}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl border font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
