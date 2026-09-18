import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProviderProfileForm } from "@/components/provider-profile-form";
import { ServicesManager } from "@/components/services-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Stars } from "@/components/stars";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";


export const metadata: Metadata = { title: "Provider dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let user;
  try {
    user = await requireProvider();
  } catch {
    redirect("/login");
  }
  const profile = await prisma.providerProfile.findUnique({
    where: { id: user.providerProfile!.id },
    include: {
      services: { orderBy: { price: "asc" } },
      _count: { select: { requests: true, reviews: true } },
    },
  });
  if (!profile) redirect("/login");

  const dict = await getDict();
  const t = (k: string) => tr(dict, k);
  const newRequests = await prisma.bookingRequest.count({
    where: { profileId: profile.id, status: "NEW" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dash.subtitle")}{" "}
            <Link
              href={`/provider/${profile.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {profile.name}
            </Link>
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            href="/dashboard/requests"
            className="rounded-xl border bg-card px-4 py-3 text-center shadow-sm hover:border-primary"
          >
            <div className="text-2xl font-bold">{newRequests}</div>
            <div className="text-muted-foreground">{t("dash.newRequests")}</div>
          </Link>
          <div className="rounded-xl border bg-card px-4 py-3 text-center shadow-sm">
            <div className="text-2xl font-bold">{profile.ratingCount}</div>
            <div className="text-muted-foreground">{t("dash.reviews")}</div>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 text-center shadow-sm">
            <div className="flex items-center justify-center pt-1">
              <Stars value={profile.ratingAvg} showValue={false} />
            </div>
            <div className="text-muted-foreground">
              {profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : "—"} {t("dash.avg")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>{t("dash.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderProfileForm profile={profile} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>{t("dash.classesPricing")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ServicesManager
              profileId={profile.id}
              services={profile.services.map((s) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                price: s.price,
                priceUnit: s.priceUnit,
                ageMin: s.ageMin,
                ageMax: s.ageMax,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
