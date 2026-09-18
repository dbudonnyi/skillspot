import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LocaleProvider } from "@/components/locale-provider";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillSpot — Kids' & adults' activities in Warsaw",
    template: "%s · SkillSpot",
  },
  description:
    "Find and compare sports clubs, schools, tutors and hobby classes for kids and adults in Warsaw. Map search, real reviews, direct booking requests.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, read: false },
      })
    : 0;

  return (
    <html lang={locale} className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LocaleProvider initial={locale}>
          <SiteHeader
            user={
              user
                ? {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileSlug: user.providerProfile?.slug ?? null,
                  }
                : null
            }
            unread={unread}
          />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
