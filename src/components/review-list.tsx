"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Stars } from "@/components/stars";
import { useT } from "@/components/locale-provider";
import { LOCALE_NAMES } from "@/i18n/dictionary";
import { Languages, Loader2 } from "lucide-react";

export type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  photos: string[];
  userName: string;
  createdAt: string;
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const { t, locale } = useT();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trState, setTrState] = useState<
    Record<string, "loading" | "done" | "error">
  >({});
  const [trText, setTrText] = useState<Record<string, string>>({});

  const translate = async (r: ReviewItem) => {
    const st = trState[r.id];
    if (st === "done") {
      setTrState({ ...trState, [r.id]: "idle" as never });
      return;
    }
    if (trText[r.id]) {
      setTrState({ ...trState, [r.id]: "done" });
      return;
    }
    setTrState({ ...trState, [r.id]: "loading" });
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: r.text, to: locale }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { translation?: string };
      if (!json.translation) throw new Error();
      setTrText({ ...trText, [r.id]: json.translation });
      setTrState({ ...trState, [r.id]: "done" });
    } catch {
      setTrState({ ...trState, [r.id]: "error" });
    }
  };

  if (reviews.length === 0)
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("review.noReviewYet")}
      </div>
    );

  return (
    <div className="space-y-4">
      {reviews.map((r, idx) => {
        const d = new Date(r.createdAt);
        const long = r.text.length > 220;
        const open = expanded === r.id;
        const showTr = trState[r.id] === "done" && trText[r.id];
        return (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(idx * 0.03, 0.15) }}
            className="rounded-2xl border bg-card p-4 shadow-soft"
            data-testid="review-card"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {r.userName
                    .split(/\s+/)
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{r.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {d.toLocaleDateString(
                    locale === "uk" ? "uk-UA" : locale === "pl" ? "pl-PL" : "en-GB",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <Stars value={r.rating} showValue={false} />
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={showTr ? "tr" : "orig"}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
                className="mt-3 whitespace-pre-line text-sm leading-relaxed"
              >
                {(showTr ? trText[r.id] : long && !open
                  ? r.text.slice(0, 220) + "\u2026"
                  : r.text) as string}
                {!showTr && long && (
                  <button
                    className="ml-1 text-xs font-medium text-primary hover:underline"
                    onClick={() => setExpanded(open ? null : r.id)}
                  >
                    {open ? t("review.readLess") : t("review.readMore")}
                  </button>
                )}
              </motion.p>
            </AnimatePresence>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => translate(r)}
                data-testid="review-translate"
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {trState[r.id] === "loading" ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    {t("trans.doing")}
                  </>
                ) : trState[r.id] === "error" ? (
                  t("trans.failed")
                ) : showTr ? (
                  <>
                    <Languages className="size-3" />
                    {t("trans.hide")}
                  </>
                ) : (
                  <>
                    <Languages className="size-3" />
                    {t("trans.see")}
                  </>
                )}
              </button>
              {showTr && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {t("trans.byLocale", { lang: LOCALE_NAMES[locale] })}
                </span>
              )}
            </div>
            {r.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {r.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    <Image src={p} alt={t("review.photoAlt")} fill sizes="80px" className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
