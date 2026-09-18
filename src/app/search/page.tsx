import { Suspense } from "react";
import type { Metadata } from "next";
import { searchProfiles, type ProfileWithDistance } from "@/lib/search";
import { CATEGORIES } from "@/lib/geo";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import { SearchBar } from "@/components/search-bar";

export const metadata: Metadata = { title: "Discover activities" };
export const dynamic = "force-dynamic";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function str(sp: Record<string, string | string[] | undefined>, k: string) {
  const v = sp[k];
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(sp: Record<string, string | string[] | undefined>, k: string) {
  const v = str(sp, k);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const sp = await searchParams;

  const category =
    CATEGORIES.find((c) => c === str(sp, "category")) ?? undefined;
  const sort = (["distance", "rating", "reviews", "price"] as const).find(
    (s) => s === str(sp, "sort"),
  );
  const areaName = str(sp, "area");
  const params = {
    q: str(sp, "q"),
    category,
    age: num(sp, "age"),
    minRating: num(sp, "minRating"),
    maxDistanceKm: num(sp, "maxDistanceKm"),
    lat: num(sp, "lat"),
    lng: num(sp, "lng"),
    sort,
  };

  let results: ProfileWithDistance[] = [];
  try {
    results = await searchProfiles(params);
  } catch (err) {
    console.error("[search]", err);
  }

  const usingUserLocation = str(sp, "near") === "1";

  // pass user coords to the map via query so ProvidersMap can show "you" + radius
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 max-w-2xl">
        <SearchBar initialQuery={params.q ?? ""} />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 shrink-0">
          <SearchFilters />
        </aside>
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <SearchResults
              results={results}
              params={{
                q: params.q,
                category,
                age: params.age,
                minRating: params.minRating,
                maxDistanceKm: params.maxDistanceKm,
                sort,
              }}
              usingUserLocation={usingUserLocation}
              areaName={areaName}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
