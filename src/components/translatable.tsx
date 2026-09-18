"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Loader2 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { textLooksNative } from "@/lib/text-lang";

/**
 * Free-text block with on-demand machine translation into the active UI
 * locale. Content is stored in whatever language the provider typed it in.
 */
export function Translatable({
  text,
  className,
  as = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "span";
}) {
  const { t, locale } = useT();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [translation, setTranslation] = useState<string | null>(null);

  const toggle = async () => {
    if (state === "done") {
      setState("idle");
      return;
    }
    if (translation) {
      setState("done");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, to: locale }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { translation?: string };
      if (!json.translation) throw new Error();
      setTranslation(json.translation);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const Tag = as;
  const hideToggle = textLooksNative(text, locale);
  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state === "done" ? "tr" : "orig"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          <Tag
            className={
              "whitespace-pre-line " + (className ?? "text-sm leading-relaxed")
            }
          >
            {state === "done" && translation ? translation : text}
          </Tag>
        </motion.div>
      </AnimatePresence>
      {!hideToggle && (
      <button
        type="button"
        onClick={toggle}
        data-testid="translate-toggle"
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {state === "loading" ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            {t("trans.doing")}
          </>
        ) : state === "error" ? (
          t("trans.failed")
        ) : state === "done" ? (
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
      )}
    </div>
  );
}
