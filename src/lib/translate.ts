import "server-only";
import { createHash } from "crypto";
import { prisma } from "./db";
import type { Locale } from "@/i18n/dictionary";

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "SkillSpot/1.0" },
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return res.json();
}

type Endpoint = {
  name: string;
  call: (text: string, from: string, to: string) => Promise<string | null>;
};

const ENDPOINTS: Endpoint[] = [
  {
    name: "lingva",
    call: async (text, from, to) => {
      const j = (await fetchJson(
        `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text)}`,
      )) as { translation?: string };
      return j.translation ?? null;
    },
  },
  {
    name: "mymemory",
    call: async (text, from, to) => {
      const j = (await fetchJson(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${from}|${to}`,
      )) as { responseData?: { translatedText?: string } };
      const t = j.responseData?.translatedText;
      if (!t || /MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(t)) return null;
      return t;
    },
  },
];

/**
 * Heuristic source-language detection for our content universe (en/pl/uk).
 * Cyrillic => uk (ru is also mapped to uk: our users are UA-speaking).
 * Polish diacritics/keywords => pl. Otherwise => en.
 */
export function detectSource(text: string): Locale {
  if (/[\u0400-\u04FF]/.test(text)) return "uk";
  if (/[żźęłąńćśŻŹĘŁĄŃĆŚ]|\d{4}\s|zaj[eę]c|szko[lł]|dzieci|dla dzieci|klub|zgrup/i.test(text))
    return "pl";
  return "en";
}

/** Providers cap requests (~500 chars); split long texts on sentence boundaries. */
function chunkText(text: string, max = 450): string[] {
  if (text.length <= max) return [text];
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length > max && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur = (cur + " " + s).trim();
    }
    // hard-split pathological giant sentences
    while (cur.length > max * 1.4) {
      chunks.push(cur.slice(0, max));
      cur = cur.slice(max);
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function machineTranslate(
  text: string,
  from: Locale,
  to: Locale,
): Promise<{ text: string; provider: string } | null> {
  const chunks = chunkText(text);
  for (const ep of ENDPOINTS) {
    try {
      const parts: string[] = [];
      for (const c of chunks) {
        const out = await ep.call(c, from, to);
        if (!out) throw new Error("empty chunk");
        parts.push(out.trim());
      }
      const joined = parts.join(" ").replace(/\s+/g, " ");
      // Guard: some providers silently echo the source for flaky pairs (uk->en).
      const changedScript =
        /[\u0400-\u04FF]/.test(text) !== /[\u0400-\u04FF]/.test(joined);
      const changedPl =
        (/[żźęłąńćś]/i.test(text)) !== (/[żźęłąńćś]/i.test(joined));
      const looksTranslated =
        joined !== text && (changedScript || changedPl || joined.toLowerCase() !== text.toLowerCase());
      if (joined && looksTranslated) return { text: joined, provider: ep.name };
    } catch {
      /* next provider */
    }
  }
  return null;
}

/** Cached machine translation of free text into locale `to`. */
export async function translateText(
  text: string,
  to: Locale,
): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;
  const from = detectSource(clean);
  if (from === to) return clean;

  const key = createHash("sha1")
    .update(`${from}>${to}>${clean}`)
    .digest("hex");

  const hit = await prisma.translation.findUnique({ where: { key } });
  if (hit) return hit.target;

  const res = await machineTranslate(clean, from, to);
  if (!res) return null;

  await prisma.translation
    .upsert({
      where: { key },
      update: { target: res.text.slice(0, 4000) },
      create: {
        key,
        source: clean.slice(0, 4000),
        target: res.text.slice(0, 4000),
        to,
        detected: from,
        provider: res.provider,
      },
    })
    .catch(() => undefined);

  return res.text;
}
