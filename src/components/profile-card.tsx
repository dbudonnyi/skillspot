"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, BadgeCheck } from "lucide-react";
import type { ProfileWithDistance } from "@/lib/search";
import { CATEGORY_ICONS, formatDistance, type CategoryValue } from "@/lib/geo";
import { Stars } from "./stars";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/locale-provider";

export function ProfileCard({ p }: { p: ProfileWithDistance }) {
  const { t } = useT();
  const icon = CATEGORY_ICONS[p.category as CategoryValue] ?? "\u2728";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link
        href={`/provider/${p.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-pop"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {p.coverImage ? (
            <Image
              src={p.coverImage}
              alt={p.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {icon}
            </div>
          )}
          <Badge className="absolute left-2 top-2 gap-1 border-0 bg-black/55 text-white backdrop-blur-md">
            <span>{icon}</span>
            {t("cat." + p.category)}
          </Badge>
          {p.featured && (
            <Badge className="absolute right-2 top-2 border-0 bg-amber-500 text-black">
              \u2b50 Featured
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold leading-tight">
              {p.name}
              {p.verified && (
                <BadgeCheck className="ml-1 inline size-4 text-blue-500 align-text-bottom" />
              )}
            </h3>
            {p.distanceKm !== null && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {formatDistance(p.distanceKm)}
              </span>
            )}
          </div>
          <Stars value={p.ratingAvg} count={p.ratingCount} />
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {p.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {p.district ?? "Warsaw"}
            </span>
            <span className="inline-flex items-center gap-1">
              🎂 {p.minAge}
              {p.maxAge > 17 ? "+" : "\u2013" + p.maxAge}
              {p.priceFrom !== null && (
                <span className="ml-2 font-semibold text-foreground">
                  {t("profile.from", { price: p.priceFrom })}
                </span>
              )}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
