import { NextRequest, NextResponse } from "next/server";
import { searchProfiles } from "@/lib/search";
import { CATEGORIES } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category") || undefined;
  if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  const num = (name: string) => {
    const v = sp.get(name);
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const sortRaw = sp.get("sort");
  const sort = (["distance", "rating", "reviews", "price"] as const).find(
    (s) => s === sortRaw
  );

  try {
    const results = await searchProfiles({
      q: sp.get("q") || undefined,
      category,
      age: num("age"),
      minRating: num("minRating"),
      maxDistanceKm: num("maxDistanceKm"),
      lat: num("lat"),
      lng: num("lng"),
      sort,
    });
    return NextResponse.json({ count: results.length, results });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
