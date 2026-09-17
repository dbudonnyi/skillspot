import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileCard } from "@/components/profile-card";
import { haversineKm, WARSAW_CENTER } from "@/lib/geo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = { title: "Favorites" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">My favorites</h1>
      {favs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="text-4xl">❤️</div>
          <p className="mt-3 text-muted-foreground">
            You haven&apos;t saved any places yet.
          </p>
          <Link href="/search" className={cn(buttonVariants(), "mt-4")}>
            Discover activities
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map((f) => {
            const p = f.profile;
            return (
              <ProfileCard
                key={f.id}
                p={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  category: p.category,
                  subcategory: p.subcategory,
                  description: p.description,
                  district: p.district,
                  address: p.address,
                  lat: p.lat,
                  lng: p.lng,
                  coverImage: p.coverImage,
                  ratingAvg: p.ratingAvg,
                  ratingCount: p.ratingCount,
                  priceFrom: p.priceFrom,
                  priceUnit: p.priceUnit,
                  minAge: p.minAge,
                  maxAge: p.maxAge,
                  verified: p.verified,
                  featured: p.featured,
                  distanceKm: haversineKm(
                    WARSAW_CENTER.lat,
                    WARSAW_CENTER.lng,
                    p.lat,
                    p.lng
                  ),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
