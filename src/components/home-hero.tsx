"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { NearMeCta } from "@/components/near-me-cta";
import { CATEGORY_ICONS, type CategoryValue } from "@/lib/geo";
import { useT } from "@/components/locale-provider";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.15, duration: 0.6, delay: i * 0.06 },
  }),
};

export function HomeHero({
  providerCount,
  reviewCount,
}: {
  providerCount: number;
  reviewCount: number;
}) {
  const { t } = useT();
  const cats: CategoryValue[] = [
    "FOOTBALL", "SWIMMING", "MUSIC", "DANCE", "MARTIAL_ARTS", "CHESS",
  ];

  return (
    <section className="apple-hero relative overflow-hidden border-b">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center md:pb-24 md:pt-28">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
            <MapPin className="size-3.5 text-primary" /> {t("home.badge")}
          </span>
        </motion.div>
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold tracking-tight md:text-7xl"
        >
          {t("home.titleA")}{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 bg-clip-text text-transparent">
            {t("home.titleB")}
          </span>{" "}
          {t("home.titleC")}
        </motion.h1>
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl"
        >
          {t("home.subtitle")}
        </motion.p>
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mt-9 flex max-w-2xl flex-col items-center gap-3"
        >
          <SearchBar />
          <div className="flex items-center gap-2">
            <NearMeCta />
            <span className="text-xs text-muted-foreground">
              {t("home.stats", { n: providerCount, m: reviewCount })}
            </span>
          </div>
        </motion.div>
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm"
        >
          {cats.map((c) => (
            <Link
              key={c}
              href={"/search?category=" + c}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3.5 py-1.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <span>{CATEGORY_ICONS[c]}</span> {t("cat." + c)}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
