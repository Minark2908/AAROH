"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type SupportedLanguage } from "@/i18n/i18n";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useProfile";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void> | void;
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "language";

function normalizeLanguage(input: unknown): SupportedLanguage {
  const v = String(input || "").toLowerCase();
  if (v === "hi" || v === "gu" || v === "en") return v;
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Only fetch profile if authenticated (has token)
  const hasToken = typeof window !== "undefined" ? !!localStorage.getItem("aaroh_token") : false;
  const { data: profile } = useUserProfile(hasToken);
  const updateProfile = useUpdateUserProfile();

  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) setLanguageState(normalizeLanguage(saved));
    } catch {
      // ignore storage failures
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!profile?.preferred_language) return;
    const fromBackend = normalizeLanguage(profile.preferred_language);
    setLanguageState((prev) => (prev === fromBackend ? prev : fromBackend));
    try {
      localStorage.setItem(STORAGE_KEY, fromBackend);
    } catch {
      // ignore
    }
  }, [profile?.preferred_language]);

  // keep <html lang> updated for accessibility/SEO hints
  useEffect(() => {
    if (!hydrated) return;
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [hydrated, language]);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore
      }

      // best-effort backend persistence; should not block UI
      try {
        await updateProfile.mutateAsync({ language: lang });
      } catch {
        // ignore (offline / backend issue). localStorage keeps it sticky.
      }
    },
    [updateProfile]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>, fallback?: string) =>
      translate(language, key, vars, fallback),
    [language]
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

