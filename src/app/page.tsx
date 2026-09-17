import Link from "next/link";
import { Search, MapPin, Star, CalendarCheck, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { searchProfiles } from "@/lib/search";
import { CATEGORY_ICONS, CATEGORY_LABELS, type CategoryValue } from "@/lib/geo";
import { ProfileCard } from "@/components/profile-card";
import { SearchBar } from "@/components/search-bar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default async function HomePage() {
  const [topRated, providerCount, reviewCount] = await Promise.all([
    searchProfiles({ sort: "rating" }).then((r) =>
      r.filter((p) => p.ratingCount > 2).slice(0, 6)
    ),
    prisma.providerProfile.count(),
    prisma.review.count(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/40 dark:via-background dark:to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium shadow-sm">
            <MapPin className="size-3.5 text-primary" /> Warsaw, Poland
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Find the right{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              activity
            </span>{" "}
            for your kid — or for you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Sports clubs, music schools, tutors and hobby classes near you.
            Compare ratings, browse the map, and contact providers directly.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            {(
              [
                "FOOTBALL",
                "SWIMMING",
                "MUSIC",
                "DANCE",
                "MARTIAL_ARTS",
                "CHESS",
              ] as CategoryValue[]
            ).map((c) => (
              <Link
                key={c}
                href={`/search?category=${c}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                <span>{CATEGORY_ICONS[c]}</span> {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <strong>{providerCount}</strong> providers ·{" "}
            <strong>{reviewCount}</strong> reviews across Warsaw
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Search & compare",
              text: "Filter by category, age, distance and rating. Sort by what matters to you.",
            },
            {
              icon: MapPin,
              title: "Explore the map",
              text: "See every club and school around you on an interactive Warsaw map.",
            },
            {
              icon: CalendarCheck,
              title: "Request a spot",
              text: "Send a booking request or contact the provider directly — phone, email, Booksy.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <f.icon className="size-8 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top rated */}
      {topRated.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Star className="size-5 fill-amber-400 text-amber-400" /> Top rated
              in Warsaw
            </h2>
            <Link
              href="/search?sort=rating"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              See all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((p) => (
              <ProfileCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Provider CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white md:p-12">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-bold md:text-3xl">
              Run a club or teach something you love?
            </h2>
            <p className="mt-2 text-indigo-100">
              List your school on SkillSpot for free. Get discovered by parents
              searching near you and manage requests in your dashboard.
            </p>
            <Link
              href="/register?role=PROVIDER"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "mt-6")}
            >
              Add your business
            </Link>
          </div>
          <ShieldCheck className="absolute -bottom-8 -right-6 size-48 text-white/10" />
        </div>
      </section>
    </div>
  );
}
