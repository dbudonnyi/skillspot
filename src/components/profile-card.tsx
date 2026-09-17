import Link from "next/link";
import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import type { ProfileWithDistance } from "@/lib/search";
import { CATEGORY_ICONS, CATEGORY_LABELS, formatDistance, type CategoryValue } from "@/lib/geo";
import { Stars } from "./stars";
import { Badge } from "@/components/ui/badge";

export function ProfileCard({ p }: { p: ProfileWithDistance }) {
  const icon =
    CATEGORY_ICONS[(p.category as CategoryValue)] ?? "✨";
  return (
    <Link
      href={`/provider/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {p.coverImage ? (
          <Image
            src={p.coverImage}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {icon}
          </div>
        )}
        <Badge className="absolute left-2 top-2 gap-1 bg-black/60 text-white border-0 backdrop-blur-sm">
          <span>{icon}</span>
          {CATEGORY_LABELS[p.category as CategoryValue] ?? p.category}
        </Badge>
        {p.featured && (
          <Badge className="absolute right-2 top-2 border-0 bg-amber-500 text-black">
            Featured
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
            🎂 {p.minAge}–{p.maxAge > 17 ? "∞" : p.maxAge} yrs
            {p.priceFrom !== null && (
              <span className="ml-2 font-semibold text-foreground">
                from {p.priceFrom} zł
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
