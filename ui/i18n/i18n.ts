import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import gu from "@/locales/gu.json";

export type SupportedLanguage = "en" | "hi" | "gu";

type Dict = Record<string, string>;

const dictionaries: Record<SupportedLanguage, Dict> = {
  en: en as Dict,
  hi: hi as Dict,
  gu: gu as Dict,
};

export function getDictionary(lang: SupportedLanguage): Dict {
  return dictionaries[lang] || dictionaries.en;
}

export function formatTemplate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function translate(
  lang: SupportedLanguage,
  key: string,
  vars?: Record<string, string | number>,
  fallback?: string
) {
  const dict = getDictionary(lang);
  const base = dict[key] ?? dictionaries.en[key] ?? fallback ?? key;

  // simple plural convention: key_plural (used for days)
  if (typeof vars?.count === "number" && vars.count !== 1) {
    const pluralKey = `${key}_plural`;
    const plural = dict[pluralKey] ?? dictionaries.en[pluralKey];
    if (plural) return formatTemplate(plural, vars);
  }

  return formatTemplate(base, vars);
}

