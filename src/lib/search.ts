import "server-only";
import { prisma } from "./db";
import { haversineKm, WARSAW_CENTER } from "./geo";
import { Prisma } from "@prisma/client";

export type SearchParams = {
  q?: string;
  category?: string;
  age?: number;
  minRating?: number;
  maxDistanceKm?: number;
  lat?: number;
  lng?: number;
  sort?: "distance" | "rating" | "reviews" | "price";
  featured?: boolean;
};

export type ProfileWithDistance = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  district: string | null;
  address: string;
  lat: number;
  lng: number;
  coverImage: string | null;
  ratingAvg: number;
  ratingCount: number;
  priceFrom: number | null;
  priceUnit: string;
  minAge: number;
  maxAge: number;
  verified: boolean;
  featured: boolean;
  distanceKm: number | null;
};

const DEGREE_KM_LAT = 111.32;

export async function searchProfiles(
  p: SearchParams
): Promise<ProfileWithDistance[]> {
  const origin =
    typeof p.lat === "number" && typeof p.lng === "number"
      ? { lat: p.lat, lng: p.lng }
      : WARSAW_CENTER;

  const where: Prisma.ProviderProfileWhereInput = {};

  if (p.category) {
    (where as Record<string, unknown>).category = p.category;
  }
  if (p.minRating && p.minRating > 0) where.ratingAvg = { gte: p.minRating };
  if (p.featured) where.featured = true;
  if (p.age !== undefined && p.age !== null) {
    where.minAge = { lte: p.age };
    where.maxAge = { gte: p.age };
  }
  if (p.q && p.q.trim()) {
    const q = p.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { subcategory: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
    ];
  }

  // Pre-filter with a bounding box when a max distance is requested
  // (cheap index-free scan reduction; haversine does the exact cut).
  if (p.maxDistanceKm && p.maxDistanceKm > 0) {
    const dLat = p.maxDistanceKm / DEGREE_KM_LAT;
    const cos = Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180));
    const dLng = p.maxDistanceKm / (DEGREE_KM_LAT * cos);
    where.lat = { gte: origin.lat - dLat, lte: origin.lat + dLat };
    where.lng = { gte: origin.lng - dLng, lte: origin.lng + dLng };
  }

  const order: Prisma.ProviderProfileOrderByWithRelationInput =
    p.sort === "rating"
      ? { ratingAvg: "desc" }
      : p.sort === "reviews"
        ? { ratingCount: "desc" }
        : p.sort === "price"
          ? { priceFrom: { sort: "asc", nulls: "last" } }
          : { ratingCount: "desc" }; // fallback order before distance sort

  const rows = await prisma.providerProfile.findMany({
    where,
    orderBy: order,
    take: p.sort === "distance" || p.maxDistanceKm ? 500 : 200,
  });

  let out: ProfileWithDistance[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    description: r.description,
    district: r.district,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    coverImage: r.coverImage,
    ratingAvg: r.ratingAvg,
    ratingCount: r.ratingCount,
    priceFrom: r.priceFrom,
    priceUnit: r.priceUnit,
    minAge: r.minAge,
    maxAge: r.maxAge,
    verified: r.verified,
    featured: r.featured,
    distanceKm: haversineKm(origin.lat, origin.lng, r.lat, r.lng),
  }));

  if (p.maxDistanceKm && p.maxDistanceKm > 0) {
    out = out.filter((r) => (r.distanceKm ?? 0) <= p.maxDistanceKm!);
  }

  if (p.sort === "distance") {
    out.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    out = out.slice(0, 200);
  }
  return out;
}

export async function getProfileBySlug(slug: string) {
  return prisma.providerProfile.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { price: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
    },
  });
}
