"use client";

import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, List, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import type { ProfileWithDistance } from "@/lib/search";
import { ProfileCard } from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/locale-provider";
import { requestPosition, geoErrorKey } from "@/lib/geolocation";

const ProvidersMap = dynamic(
  () => import("@/components/providers-map").then((m) => m.ProvidersMap),
  { ssr: false },
);

const SORT_KEYS = [
  ["", "sort.best"],
  ["distance", "sort.distance"],
  ["rating", "sort.rating"],
  ["reviews", "sort.reviews"],
  ["price", "sort.price"],
] as const;

export function SearchResults({
  results,
  params,
  usingUserLocation,
  areaName,
}: {
  results: ProfileWithDistance[];
  params: {
    q?: string;
    category?: string;
    age?: number;
    minRating?: number;
    maxDistanceKm?: number;
    sort?: string;
  };
  usingUserLocation: boolean;
  areaName?: string;
}) {
  const { t } = useT();
  const [view, setView] = useState<"list" | "map">("list");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setSort = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set("sort", v);
    else next.delete("sort");
    router.push(pathname + "?" + next.toString(), { scroll: false });
  };

  const countLabel = usingUserLocation
    ? t("search.countNear", { n: results.length })
    : areaName
      ? t("search.countArea", { n: results.length, area: areaName })
      : t("search.count", { n: results.length });

  const retryNearMe = async () => {
    try {
      const { lat, lng } = await requestPosition();
      const next = new URLSearchParams(sp.toString());
      next.set("lat", lat.toFixed(6));
      next.set("lng", lng.toFixed(6));
      next.set("near", "1");
      next.set("sort", "distance");
      router.push(pathname + "?" + next.toString(), { scroll: false });
    } catch (e) {
      toast.error(t("near.errTitle"), { description: t(geoErrorKey(e)), duration: 9000 });
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground" data-testid="results-count">
          <motion.strong
            key={results.length}
            initial={{ scale: 1.2, color: "var(--primary)" }}
            animate={{ scale: 1, color: "var(--foreground)" }}
            transition={{ duration: 0.25 }}
          >
            {countLabel}
          </motion.strong>
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-xl border p-0.5">
          {SORT_KEYS.map(([v, key]) => (
            <button
              key={v || "match"}
              onClick={() => setSort(v)}
              className={
                "relative rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
                ((params.sort ?? "") === v
                  ? "text-primary-foreground"
                  : "hover:bg-accent")
              }
            >
              {(params.sort ?? "") === v && (
                <motion.span
                  layoutId="sort-pill"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{t(key)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border p-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="mr-1 size-4" /> {t("view.list")}
          </Button>
          <Button
            variant={view === "map" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
          >
            <Map className="mr-1 size-4" /> {t("view.map")}
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-card p-12 text-center"
        >
          <div className="text-4xl">🔍</div>
          <h3 className="mt-3 font-semibold">{t("search.nothingTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("search.nothingText")}
          </p>
          {!usingUserLocation && (
            <Button className="mt-4 rounded-xl" onClick={retryNearMe}>
              <LocateFixed className="mr-2 size-4" />
              {t("search.showNearMe")}
            </Button>
          )}
        </motion.div>
      ) : view === "list" ? (
        <motion.div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {results.map((p) => (
            <ProfileCard key={p.id} p={p} />
          ))}
        </motion.div>
      ) : (
        <ProvidersMap profiles={results} />
      )}
    </div>
  );
}
