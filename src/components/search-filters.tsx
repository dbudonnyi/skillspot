"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES, CATEGORY_ICONS, type CategoryValue } from "@/lib/geo";
import { useT } from "@/components/locale-provider";
import { LocationPicker } from "@/components/location-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SearchFilters() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(sp.toString());
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
      router.push(pathname + "?" + next.toString(), { scroll: false });
    },
    [router, pathname, sp],
  );

  const category = sp.get("category") ?? "";
  const age = sp.get("age") ?? "";
  const minRating = sp.get("minRating") ?? "";
  const maxDistanceKm = sp.get("maxDistanceKm") ?? "";
  const hasCenter = Boolean(sp.get("lat") && sp.get("lng"));

  const selectCls =
    "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{t("filters.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>{t("filters.location")}</Label>
          <LocationPicker />
          {!hasCenter && (
            <p className="text-xs text-muted-foreground">
              {t("filters.warsawCenter")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-cat">{t("filters.category")}</Label>
          <select
            id="f-cat"
            value={category}
            onChange={(e) => update("category", e.target.value)}
            className={selectCls}
          >
            <option value="">{t("filters.allCategories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICONS[c as CategoryValue]}{" "}
                {t("cat." + c)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-age">{t("filters.childAge")}</Label>
          <input
            id="f-age"
            type="number"
            min={0}
            max={99}
            value={age}
            placeholder={t("filters.agePlaceholder")}
            onChange={(e) => update("age", e.target.value)}
            className={selectCls}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-dist">{t("filters.distance")}</Label>
          <select
            id="f-dist"
            disabled={!hasCenter}
            value={maxDistanceKm}
            onChange={(e) => update("maxDistanceKm", e.target.value)}
            className={selectCls + " disabled:opacity-50"}
          >
            <option value="">{t("filters.anyDistance")}</option>
            {[2, 5, 10, 20].map((km) => (
              <option key={km} value={String(km)}>
                {t("filters.within", { km })}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("filters.minRating")}</Label>
          <div className="flex gap-1">
            {["", "3", "4", "4.5"].map((r) => (
              <button
                key={r || "any"}
                type="button"
                onClick={() => update("minRating", r)}
                className={
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all " +
                  (minRating === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent")
                }
              >
                {r ? r + "\u2605+" : t("filters.any")}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full rounded-xl"
          onClick={() => router.push(pathname)}
        >
          {t("filters.clear")}
        </Button>
      </CardContent>
    </Card>
  );
}
