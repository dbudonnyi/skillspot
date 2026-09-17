import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0, items: [] });
  const items = await prisma.notification.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    count: items.filter((i) => !i.read).length,
    items,
  });
}
