"use client";

export type GeoError = "unsupported" | "insecure" | "denied" | "unavailable" | "timeout";

export function isSecureCtx(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

/** Promise wrapper over geolocation with typed errors. */
export function requestPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject("unsupported" as GeoError);
      return;
    }
    if (!isSecureCtx()) {
      reject("insecure" as GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject("denied" as GeoError);
        else if (err.code === err.POSITION_UNAVAILABLE)
          reject("unavailable" as GeoError);
        else reject("timeout" as GeoError);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300_000 },
    );
  });
}

export const GEO_ERROR_KEYS: Record<GeoError, string> = {
  unsupported: "geo.unsupported",
  insecure: "geo.insecure",
  denied: "geo.denied",
  unavailable: "geo.unavailable",
  timeout: "geo.timeout",
};

export function geoErrorKey(e: unknown): string {
  if (typeof e === "string" && e in GEO_ERROR_KEYS) return GEO_ERROR_KEYS[e as GeoError];
  return "geo.unavailable";
}

/** Warsaw bounds check — geolocation outside the city is useless for us. */
export function inWarsawArea(lat: number, lng: number): boolean {
  return lat > 52.02 && lat < 52.42 && lng > 20.82 && lng < 21.32;
}
