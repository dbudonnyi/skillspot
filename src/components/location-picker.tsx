"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LocateFixed, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";
import { requestPosition, geoErrorKey, inWarsawArea } from "@/lib/geolocation";
import { WARSAW_DISTRICTS } from "@/lib/geo";
import { Button } from "@/components/ui/button";

const DISTRICTS = Object.keys(WARSAW_DISTRICTS).sort();

type Mode = "idle" | "locating" | "gps" | "area";

/**
 * The location control: "Near me" (GPS) | district picker | whole city.
 * Sets lat/lng (+ area name) in the URL; SearchResults react to those.
 */
export function LocationPicker() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [mode, setMode] = useState<Mode>(() =>
    sp.get("near") === "1"
      ? "gps"
      : sp.get("area")
        ? "area"
        : sp.get("lat")
          ? "gps"
          : "idle",
  );
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      router.push(pathname + "?" + next.toString(), { scroll: false });
    },
    [router, pathname, sp],
  );

  const useMyLocation = async () => {
    setMode("locating");
    try {
      const { lat, lng } = await requestPosition();
      const inside = inWarsawArea(lat, lng);
      patch({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        near: "1",
        area: null,
        sort: "distance",
        maxDistanceKm: sp.get("maxDistanceKm") || "5",
      });
      if (!mounted.current) return;
      setMode("gps");
      toast.success(t(inside ? "near.toastSet" : "near.toastOutside"));
    } catch (e) {
      if (!mounted.current) return;
      setMode(sp.get("area") ? "area" : "idle");
      toast.error(t("near.errTitle"), {
        description: t(geoErrorKey(e)),
        duration: 9000,
      });
    }
  };

  const pickDistrict = (name: string) => {
    if (!name) {
      patch({ lat: null, lng: null, near: null, area: null });
      setMode("idle");
      return;
    }
    const [lat, lng] = WARSAW_DISTRICTS[name];
    patch({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      area: name,
      near: null,
      sort: "distance",
      maxDistanceKm: sp.get("maxDistanceKm") || "5",
    });
    setMode("area");
  };

  const clear = () => {
    patch({ lat: null, lng: null, near: null, area: null, sort: null });
    setMode("idle");
  };

  const active = mode === "gps" || mode === "area";

  return (
    <div className="space-y-2" data-testid="location-picker">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          variant={mode === "gps" ? "default" : "outline"}
          onClick={useMyLocation}
          disabled={mode === "locating"}
          className="rounded-xl"
          data-testid="near-me"
        >
          {mode === "locating" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          <span className="ml-2 truncate">
            {mode === "locating" ? t("filters.locating") : t("filters.nearMe")}
          </span>
        </Button>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 opacity-60" />
          <select
            aria-label={t("filters.pickArea")}
            value={sp.get("area") ?? ""}
            onChange={(e) => pickDistrict(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-input bg-background pl-9 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t("filters.pickArea")}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
              <span className="font-medium">
                {mode === "gps"
                  ? t("filters.nearBadge")
                  : t("filters.areaBadge", { area: sp.get("area") ?? "" })}
              </span>
              <button
                type="button"
                onClick={clear}
                className="ml-auto inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
              >
                <X className="size-3" />
                {t("filters.clearLocation")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
