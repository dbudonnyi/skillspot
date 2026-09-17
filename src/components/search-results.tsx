"use client";

import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Map, List } from "lucide-react";
import type { ProfileWithDistance } from "@/lib/search";
import { ProfileCard } from "@/components/profile-card";
import { Button } from "@/components/ui/button";

const ProvidersMap = dynamic(
  () => import("@/components/providers-map").then((m) => m.ProvidersMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

const SORTS = [
  { v: "", l: "Best match" },
  { v: "distance", l: "Nearest to me" },
  { v: "rating", l: "Highest rated" },
  { v: "reviews", l: "Most reviews" },
  { v: "price", l: "Cheapest" },
];

export function SearchResults({
  results,
  params,
  usingUserLocation,
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
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setSort = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set("sort", v);
    else next.delete("sort");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          <strong className="text-foreground">{results.length}</strong>{" "}
          {results.length === 1 ? "place" : "places"} found
          {usingUserLocation ? " near you" : " in Warsaw"}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border p-0.5">
          {SORTS.map((s) => (
            <button
              key={s.v || "match"}
              onClick={() => setSort(s.v)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                (params.sort ?? "") === s.v
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="mr-1 size-4" /> List
          </Button>
          <Button
            variant={view === "map" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
          >
            <Map className="mr-1 size-4" /> Map
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="text-4xl">🔍</div>
          <h3 className="mt-3 font-semibold">Nothing found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try widening the distance, removing the rating filter, or searching
            another keyword.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <ProfileCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <ProvidersMap profiles={results} />
      )}
    </div>
  );
}
