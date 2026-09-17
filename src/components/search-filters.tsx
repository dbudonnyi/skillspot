"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS, type CategoryValue } from "@/lib/geo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

const DISTANCES = [
  { v: "", l: "Any distance" },
  { v: "2", l: "Within 2 km" },
  { v: "5", l: "Within 5 km" },
  { v: "10", l: "Within 10 km" },
  { v: "20", l: "Within 20 km" },
];

export function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(sp.toString());
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, sp]
  );

  const category = sp.get("category") ?? "";
  const age = sp.get("age") ?? "";
  const minRating = sp.get("minRating") ?? "";
  const maxDistanceKm = sp.get("maxDistanceKm") ?? "";

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = new URLSearchParams(sp.toString());
        next.set("lat", pos.coords.latitude.toFixed(6));
        next.set("lng", pos.coords.longitude.toFixed(6));
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      },
      () => {}
    );
  };

  const hasLoc = sp.get("lat") && sp.get("lng");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Button
            type="button"
            variant={hasLoc ? "default" : "outline"}
            size="lg"
            className="w-full"
            onClick={locateMe}
          >
            <LocateFixed className="mr-2 size-4" />
            {hasLoc ? "Using my location ✓" : "Use my location"}
          </Button>
          {hasLoc && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                const next = new URLSearchParams(sp.toString());
                next.delete("lat");
                next.delete("lng");
                router.push(`${pathname}?${next.toString()}`, { scroll: false });
              }}
            >
              Reset to Warsaw centre
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-cat">Category</Label>
          <select
            id="f-cat"
            value={category}
            onChange={(e) => update("category", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICONS[c as CategoryValue]} {CATEGORY_LABELS[c as CategoryValue]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-age">Child age</Label>
          <input
            id="f-age"
            type="number"
            min={0}
            max={99}
            value={age}
            placeholder="e.g. 7"
            onChange={(e) => update("age", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-dist">Distance</Label>
          <select
            id="f-dist"
            value={maxDistanceKm}
            onChange={(e) => update("maxDistanceKm", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DISTANCES.map((d) => (
              <option key={d.v} value={d.v}>
                {d.l}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Minimum rating</Label>
          <div className="flex gap-1">
            {["", "3", "4", "4.5"].map((r) => (
              <button
                key={r || "any"}
                type="button"
                onClick={() => update("minRating", r)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  minRating === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent"
                }`}
              >
                {r ? `${r}★+` : "Any"}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => router.push(pathname)}
        >
          Clear all
        </Button>
      </CardContent>
    </Card>
  );
}
