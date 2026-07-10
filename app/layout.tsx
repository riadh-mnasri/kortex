/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Root layout: fonts, theme bootstrap, global providers and app chrome.
 */
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { ProgressProvider } from "@/lib/engine/progress";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kortex - Keep your Kotlin sharp",
  description:
    "Spaced repetition, lessons and exercises to master the Kotlin language.",
};

/**
 * Applies the persisted theme before first paint to avoid a flash of the
 * wrong theme. Runs as a blocking inline script on purpose.
 */
const themeBootstrap = `
(function () {
  try {
    var pref = localStorage.getItem("kortex.theme") || "system";
    var dark = pref === "dark" ||
      (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <LocaleProvider>
          <ProgressProvider>
            <AppHeader />
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
              {children}
            </main>
            <AppFooter />
          </ProgressProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
