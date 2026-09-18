import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import {
  MapPin,
  Globe,
  CalendarCheck,
  Clock,
  Camera,
  ThumbsUp,
  BadgeCheck,
  Users,
} from "lucide-react";
import { getProfileBySlug } from "@/lib/search";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORY_ICONS, type CategoryValue } from "@/lib/geo";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";
import { Translatable } from "@/components/translatable";
import { ServiceCard } from "@/components/service-card";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewSection } from "@/components/review-section";
import { FavoriteButton } from "@/components/favorite-button";
import { ContactReveal } from "@/components/contact-reveal";
import { BookingDialog } from "@/components/booking-dialog";
import { Gallery } from "@/components/gallery";
import { MiniMapClient } from "@/components/minimap-client";
import { ReviewList } from "@/components/review-list";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfileBySlug(slug);
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} — ${p.category}`,
    description: p.description.slice(0, 160),
  };
}

export default async function ProviderPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === profile.ownerId;

  const favorite = user
    ? !!(await prisma.favorite.findUnique({
        where: { userId_profileId: { userId: user.id, profileId: profile.id } },
      }))
    : false;

  const dict = await getDict();
  const t = (k: string, pp?: Record<string, string | number>) => tr(dict, k, pp);

  const hours = profile.openingHours as Record<
    string,
    { open: string; close: string } | null
  > | null;

  const links = [
    profile.website && { href: profile.website, icon: Globe, label: t("profile.website") },
    profile.instagram && { href: profile.instagram, icon: Camera, label: t("profile.instagram") },
    profile.facebook && { href: profile.facebook, icon: ThumbsUp, label: t("profile.facebook") },
    profile.booksy && { href: profile.booksy, icon: CalendarCheck, label: t("profile.booksy") },
  ].filter(Boolean) as { href: string; icon: typeof Globe; label: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-muted md:h-72">
        {profile.coverImage ? (
          <Image
            src={profile.coverImage}
            alt={profile.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-7xl">
            {CATEGORY_ICONS[profile.category as CategoryValue] ?? "✨"}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1">
              {CATEGORY_ICONS[profile.category as CategoryValue]}{" "}
              {t("cat." + profile.category)}
            </Badge>
            {profile.subcategory && <Badge variant="secondary">{profile.subcategory}</Badge>}
            {profile.verified && (
              <Badge variant="secondary" className="text-blue-600">
                <BadgeCheck className="mr-1 size-3.5" /> Verified
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{profile.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <Stars value={profile.ratingAvg} count={profile.ratingCount} size="lg" />
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" /> {profile.address}
              {profile.district && ` · ${profile.district}, Warsaw`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" />{" "}
              {profile.maxAge > 17
                ? t("profile.ages", { min: profile.minAge })
                : t("profile.agesTo", { min: profile.minAge, max: profile.maxAge })}
            </span>
            {profile.priceFrom !== null && (
              <span className="font-semibold text-foreground">
                {t("profile.from", { price: profile.priceFrom })}{" "}
                <span className="font-normal text-muted-foreground">{profile.priceUnit}</span>
              </span>
            )}
          </div>
          <div className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            <Translatable text={profile.description} className="text-[15px] leading-relaxed" />
          </div>

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:border-primary hover:text-primary"
                >
                  <l.icon className="size-4" /> {l.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Actions card */}
        <Card className="w-full shrink-0 md:w-80">
          <CardContent className="space-y-3 pt-6">
            <BookingDialog
              profileId={profile.id}
              profileName={profile.name}
              services={profile.services.map((s) => ({
                id: s.id,
                title: s.title,
                price: s.price,
              }))}
              signedIn={!!user}
              isOwner={isOwner}
            />
            <FavoriteButton
              profileId={profile.id}
              initialFavorited={favorite}
              signedIn={!!user}
            />
            <Separator />
            <ContactReveal
              phone={profile.phone}
              email={profile.email}
              signedIn={!!user}
            />
          </CardContent>
        </Card>
      </div>

      {/* Gallery */}
      {profile.gallery.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">{t("profile.photos")}</h2>
          <Gallery images={[profile.coverImage, ...profile.gallery].filter(Boolean) as string[]} />
        </section>
      )}

      {/* Services */}
      {profile.services.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">{t("profile.classes")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.services.map((s) => (
              <ServiceCard
                key={s.id}
                title={s.title}
                description={s.description}
                price={s.price}
                priceUnit={s.priceUnit}
                ageMin={s.ageMin}
                ageMax={s.ageMax}
              />
            ))}
          </div>
        </section>
      )}

      {/* Hours + map */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {hours && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="size-5" /> {t("profile.hours")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => {
                  const h = hours?.[d];
                  const label = t("day." + d);
                  return (
                    <li key={d} className="flex justify-between border-b py-1 last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">
                        {h ? `${h.open} – ${h.close}` : t("profile.closed")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-5" /> {t("profile.where")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-0">
            <MiniMapClient lat={profile.lat} lng={profile.lng} name={profile.name} />
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <section className="mt-10 pb-10">
        <h2 className="mb-4 text-xl font-bold">
          {t("profile.reviews")}{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({profile.ratingCount})
          </span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div>
            <ReviewSection
              profileId={profile.id}
              profileSlug={profile.slug}
              signedIn={!!user}
              isOwner={isOwner}
              hasReviewed={
                !!(user && profile.reviews.some((r) => r.userId === user.id))
              }
              ratingAvg={profile.ratingAvg}
              ratingCount={profile.ratingCount}
            />
          </div>
          <ReviewList
            reviews={profile.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              text: r.text,
              photos: r.photos,
              userName: r.user?.name ?? "Anonymous",
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
