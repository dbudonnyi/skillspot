import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { searchProfiles } from "@/lib/search";
import { ProfileCard } from "@/components/profile-card";
import { HomeHero } from "@/components/home-hero";
import { HomeFeatures, HomeProviderCta } from "@/components/home-sections";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";
import { cn } from "cn";

export default async function HomePage() {
  const dict = await getDict();
  const t = (k: string, p?: Record<string, string | number>) => tr(dict, k, p);

  const [topRated, providerCount, reviewCount] = await Promise.all([
    searchProfiles({ sort: "rating" }).then((r) =>
      r.filter((p) => p.ratingCount > 2).slice(0, 6),
    ),
    prisma.providerProfile.count(),
    prisma.review.count(),
  ]);

  return (
    <div>
      <HomeHero providerCount={providerCount} reviewCount={reviewCount} />
      <HomeFeatures />

      {topRated.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Star className="size-5 fill-amber-400 text-amber-400" />{" "}
              {t("home.topRated")}
            </h2>
            <Link
              href="/search?sort=rating"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
            >
              {t("home.seeAll")}
              <ArrowRightInline />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((p) => (
              <ProfileCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <HomeProviderCta />
    </div>
  );
}

function ArrowRightInline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1.5"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
