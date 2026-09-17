import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RequestList } from "@/components/request-list";

export const metadata: Metadata = { title: "Incoming requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  let user;
  try {
    user = await requireProvider();
  } catch {
    redirect("/login");
  }
  const profile = await prisma.providerProfile.findUnique({
    where: { id: user.providerProfile!.id },
    select: { id: true, name: true },
  });
  if (!profile) redirect("/login");
  const requests = await prisma.bookingRequest.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      service: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-extrabold">Incoming requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Parents&apos; booking requests for {profile.name}. Accept or decline —
        they get notified instantly.
      </p>
      <RequestList
        requests={requests.map((r) => ({
          id: r.id,
          status: r.status,
          message: r.message,
          contactEmail: r.contactEmail,
          contactPhone: r.contactPhone,
          requesterName: r.user.name,
          requesterEmail: r.user.email,
          serviceTitle: r.service?.title ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
        canAct
      />
    </div>
  );
}
