"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ProfileWithDistance } from "@/lib/search";
import { WARSAW_CENTER, CATEGORY_ICONS, CATEGORY_LABELS, formatDistance, type CategoryValue } from "@/lib/geo";
import { Stars } from "@/components/stars";

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

function FitBounds({ profiles }: { profiles: ProfileWithDistance[] }) {
  const map = useMap();
  useMemo(() => {
    if (profiles.length === 0) return;
    if (profiles.length === 1) {
      map.setView([profiles[0].lat, profiles[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      profiles.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds.pad(0.12), { maxZoom: 14 });
  }, [profiles, map]);
  return null;
}

export function ProvidersMap({
  profiles,
}: {
  profiles: ProfileWithDistance[];
}) {
  const center: [number, number] = profiles[0]
    ? [profiles[0].lat, profiles[0].lng]
    : [WARSAW_CENTER.lat, WARSAW_CENTER.lng];

  return (
    <div className="h-[70vh] overflow-hidden rounded-xl border shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds profiles={profiles} />
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
                  {CATEGORY_LABELS[p.category as CategoryValue] ?? p.category}
                  {" · "}
                  {p.district ?? "Warsaw"}
                  {p.distanceKm !== null && ` · ${formatDistance(p.distanceKm)}`}
                </div>
                <div className="mt-1">
                  <Stars value={p.ratingAvg} count={p.ratingCount} />
                </div>
                <Link
                  href={`/provider/${p.slug}`}
                  className="mt-2 inline-block rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white no-underline"
                >
                  View profile
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
