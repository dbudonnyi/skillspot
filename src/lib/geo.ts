export const WARSAW_CENTER = { lat: 52.2297, lng: 21.0122 } as const;

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export const WARSAW_DISTRICTS: Record<string, [number, number]> = {
  Śródmieście: [52.2319, 21.0067],
  Wola: [52.236, 20.9845],
  Ochota: [52.2113, 20.9816],
  Mokotów: [52.193, 21.0311],
  Praga: [52.2536, 21.0352],
  Żoliborz: [52.2694, 20.9855],
  Bielany: [52.286, 20.96],
  Ursynów: [52.1445, 21.05],
  Bemowo: [52.2413, 20.9178],
  Białołęka: [52.3214, 20.9961],
  Targówek: [52.2945, 21.0433],
  Włochy: [52.2043, 20.9414],
  Ursus: [52.2019, 20.9028],
  Rembertów: [52.2669, 21.1297],
  Wawer: [52.1997, 21.164],
  Wilanów: [52.1651, 21.0922],
};

export function nearestDistrict(lat: number, lng: number): string {
  let best = "Śródmieście";
  let bestD = Infinity;
  for (const [name, [dLat, dLng]] of Object.entries(WARSAW_DISTRICTS)) {
    const d = (dLat - lat) ** 2 + (dLng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

export const CATEGORIES = [
  "FOOTBALL", "SWIMMING", "BASKETBALL", "VOLLEYBALL", "TENNIS",
  "MARTIAL_ARTS", "GYMNASTICS", "DANCE", "MUSIC", "ART", "CHESS",
  "LANGUAGES", "ROBOTICS", "SKATING", "HORSE_RIDING", "ATHLETICS", "OTHER",
] as const;

export type CategoryValue = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  FOOTBALL: "Football",
  SWIMMING: "Swimming",
  BASKETBALL: "Basketball",
  VOLLEYBALL: "Volleyball",
  TENNIS: "Tennis",
  MARTIAL_ARTS: "Martial Arts",
  GYMNASTICS: "Gymnastics",
  DANCE: "Dance",
  MUSIC: "Music",
  ART: "Art",
  CHESS: "Chess",
  LANGUAGES: "Languages",
  ROBOTICS: "Robotics & Coding",
  SKATING: "Skating",
  HORSE_RIDING: "Horse Riding",
  ATHLETICS: "Athletics",
  OTHER: "Other",
};

export const CATEGORY_ICONS: Record<CategoryValue, string> = {
  FOOTBALL: "⚽", SWIMMING: "🏊", BASKETBALL: "🏀", VOLLEYBALL: "🏐",
  TENNIS: "🎾", MARTIAL_ARTS: "🥋", GYMNASTICS: "🤸", DANCE: "💃",
  MUSIC: "🎹", ART: "🎨", CHESS: "♟️", LANGUAGES: "🗣️", ROBOTICS: "🤖",
  SKATING: "⛸️", HORSE_RIDING: "🐴", ATHLETICS: "🏃", OTHER: "✨",
};
