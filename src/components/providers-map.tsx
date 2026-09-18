"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ProfileWithDistance } from "@/lib/search";
import { WARSAW_CENTER, CATEGORY_ICONS, formatDistance, type CategoryValue } from "@/lib/geo";
import { Stars } from "@/components/stars";
import { useT } from "@/components/locale-provider";

function pinIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 4px;
      transform:rotate(-45deg);
      background:#4f46e5;border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:16px;line-height:1">${emoji}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: '<div class="user-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Fit({
  profiles,
  user,
  radiusKm,
}: {
  profiles: ProfileWithDistance[];
  user: { lat: number; lng: number; gps: boolean } | null;
  radiusKm: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (user) {
      map.setView([user.lat, user.lng], radiusKm && radiusKm <= 5 ? 13 : 12);
      return;
    }
    if (profiles.length === 0) {
      map.setView([WARSAW_CENTER.lat, WARSAW_CENTER.lng], 12);
      return;
    }
    if (profiles.length === 1) {
      map.setView([profiles[0].lat, profiles[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      profiles.map((p) => [p.lat, p.lng] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.12), { maxZoom: 14 });
  }, [profiles, user, radiusKm, map]);
  return null;
}

export function ProvidersMap({ profiles }: { profiles: ProfileWithDistance[] }) {
  const { t } = useT();
  // center params are set by LocationPicker (GPS or district preset)
  const center = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0)
      return { lat, lng, gps: sp.get("near") === "1" };
    return null;
    // profiles dep: forces URL re-read when new results arrive (component stays mounted across param changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);
  const radius = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const r = Number(sp.get("maxDistanceKm"));
    return center && Number.isFinite(r) && r > 0 ? r : null;
    // profiles dep: forces URL re-read when new results arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, center]);

  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border shadow-soft">
      <MapContainer
        center={[WARSAW_CENTER.lat, WARSAW_CENTER.lng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit profiles={profiles} user={center} radiusKm={radius} />
        {center && (
          <>
            {center.gps && (
              <Marker position={[center.lat, center.lng]} icon={userIcon}>
                <Popup>{t("map.you")}</Popup>
              </Marker>
            )}
            {radius && (
              <Circle
                center={[center.lat, center.lng]}
                radius={radius * 1000}
                pathOptions={{
                  color: "#4f46e5",
                  weight: 1.5,
                  fillOpacity: 0.06,
                  dashArray: "6 6",
                }}
              />
            )}
          </>
        )}
        {profiles.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={pinIcon(CATEGORY_ICONS[p.category as CategoryValue] ?? "📍")}
          >
            <Popup>
              <div className="min-w-44">
                <Link
                  href={`/provider/${p.slug}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {p.name}
                </Link>
                <div className="mt-1 text-xs text-neutral-600">
                  {t("cat." + p.category)}
                  {" · "}
                  {p.district ?? "Warsaw"}
                  {p.distanceKm !== null && " · " + formatDistance(p.distanceKm)}
                </div>
                <div className="mt-1">
                  <Stars value={p.ratingAvg} count={p.ratingCount} />
                </div>
                <Link
                  href={`/provider/${p.slug}`}
                  className="mt-2 inline-block rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white no-underline"
                >
                  {t("requests.viewProfile")}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
