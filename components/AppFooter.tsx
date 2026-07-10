/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 */
"use client";

import { useLocale } from "@/lib/i18n";

export function AppFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
      <p>
        © 2026 Riadh MNASRI. {t("footer.rights")}
      </p>
    </footer>
  );
}
