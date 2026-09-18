"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  en,
  LOCALES,
  LOCALE_NAMES,
  LOCALE_FLAGS,
  fmt,
  type Dict,
  type Locale,
} from "@/i18n/dictionary";

const COOKIE = "sk" + "il" + "spot_locale";

type Ctx = {
  locale: Locale;
  dict: Dict;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
  pending: boolean;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function useT(): Ctx {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("LocaleProvider missing");
  return ctx;
}

export function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initial);
  const [pending, start] = useTransition();

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      document.cookie = COOKIE + "=" + l + ";path=/;max-age=31536000;samesite=lax";
      start(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<Ctx>(() => {
    const dict = dictionaries[locale] ?? en;
    return {
      locale,
      dict,
      pending,
      setLocale,
      t: (key, params) => fmt(dict[key] ?? en[key] ?? key, params),
    };
  }, [locale, pending, setLocale]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export { LOCALES, LOCALE_NAMES, LOCALE_FLAGS };
