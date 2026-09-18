"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, CalendarCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { useT } from "@/components/locale-provider";

export function HomeFeatures() {
  const { t } = useT();
  const features = [
    { icon: Search, key: 1 },
    { icon: MapPin, key: 2 },
    { icon: CalendarCheck, key: 3 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, type: "spring", bounce: 0.15 }}
            className="rounded-3xl border bg-card p-7 shadow-soft"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
              <f.icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {t("home.feature" + f.key + "Title")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("home.feature" + f.key + "Text")}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HomeProviderCta() {
  const { t } = useT();
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", bounce: 0.15 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-pop md:p-12"
      >
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight">{t("home.ctaTitle")}</h2>
          <p className="mt-3 text-indigo-100">{t("home.ctaText")}</p>
          <Link
            href="/register?role=PROVIDER"
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "mt-7 rounded-full font-semibold",
            )}
          >
            {t("home.ctaButton")}
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </motion.div>
    </section>
  );
}
