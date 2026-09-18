import "server-only";
import { headers, cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  dictionaries,
  detectLocaleFromAcceptLanguage,
  isLocale,
  type Dict,
  type Locale,
} from "./dictionary";

export const LOCALE_COOKIE = "sk" + "il" + "spot_locale";

export async function getLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const cookie = store.get(LOCALE_COOKIE)?.value;
    if (isLocale(cookie)) return cookie;
  } catch {
    /* cookies unavailable */
  }
  try {
    const h = await headers();
    return detectLocaleFromAcceptLanguage(h.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
