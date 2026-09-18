import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RequestList } from "@/components/request-list";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";


export const metadata: Metadata = { title: "My requests" };
export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }
  const dict = await getDict();
  const t = (k: string) => tr(dict, k);
  const requests = await prisma.bookingRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { name: true, slug: true } },
      service: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">{t("myRequests.title")}</h1>
      <RequestList
        requests={requests.map((r) => ({
          id: r.id,
          status: r.status,
          message: r.message,
          contactEmail: r.contactEmail,
          contactPhone: r.contactPhone,
          requesterName: r.profile.name,
          requesterEmail: "",
          serviceTitle: r.service?.title ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
        canAct={false}
        requesterIsProvider
      />
    </div>
  );
}
