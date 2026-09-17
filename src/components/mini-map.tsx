"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:#4f46e5;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

export function MiniMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  return (
    <div className="h-64 w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
