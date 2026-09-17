"use client";

import dynamic from "next/dynamic";

const MiniMapInner = dynamic(
  () => import("@/components/mini-map").then((m) => m.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

export function MiniMapClient(props: {
  lat: number;
  lng: number;
  name: string;
}) {
  return <MiniMapInner {...props} />;
}
