"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";
import { requestPosition, geoErrorKey, inWarsawArea } from "@/lib/geolocation";

/** Hero "Near me" pill: asks for GPS, then jumps straight into distance-sorted results. */
export function NearMeCta() {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const { lat, lng } = await requestPosition();
      if (!inWarsawArea(lat, lng))
        toast.message(t("near.toastOutside"), { duration: 6000 });
      router.push(
        "/search?near=1&sort=distance&maxDistanceKm=10&lat=" +
          lat.toFixed(6) +
          "&lng=" +
          lng.toFixed(6),
      );
    } catch (e) {
      toast.error(t("near.errTitle"), {
        description: t(geoErrorKey(e)),
        duration: 9000,
      });
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      data-testid="hero-near-me"
      className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition-all hover:scale-[1.03] hover:border-primary hover:text-primary active:scale-95 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LocateFixed className="size-4 text-primary" />
      )}
      {busy ? t("filters.locating") : t("home.nearMe")}
    </button>
  );
}
