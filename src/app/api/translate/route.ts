import { NextResponse } from "next/server";
import { z } from "zod";
import { translateText } from "@/lib/translate";
import { isLocale, type Locale } from "@/i18n/dictionary";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().min(1).max(4000),
  to: z.string(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (!isLocale(parsed.data.to))
    return NextResponse.json({ error: "bad locale" }, { status: 400 });

  const out = await translateText(parsed.data.text, parsed.data.to as Locale);
  if (out === null)
    return NextResponse.json({ error: "provider_down" }, { status: 502 });

  return NextResponse.json({ translation: out });
}
