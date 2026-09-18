import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";

export async function SiteHeader({
  user,
  unread,
}: {
  user: {
    name: string;
    email: string;
    role: "USER" | "PROVIDER";
    profileSlug: string | null;
  } | null;
  unread: number;
}) {
  const dict = await getDict();
  const t = (k: string) => tr(dict, k);

  return (
    <header className="glass sticky top-0 z-[1100] border-b border-black/5 dark:border-white/10">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <GraduationCap className="size-5" />
          </span>
          <span>
            Skill<span className="text-primary">Spot</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link
            href="/search"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t("nav.discover")}
          </Link>
          <Link
            href="/search?sort=rating"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t("nav.topRated")}
          </Link>
          {user?.role === "USER" && (
            <Link
              href="/favorites"
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("nav.favorites")}
            </Link>
          )}
          {user?.role === "PROVIDER" && (
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("nav.dashboard")}
            </Link>
          )}
          {user?.role === "PROVIDER" && user.profileSlug && (
            <Link
              href={"/provider/" + user.profileSlug}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("nav.myPage")}
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <LocaleSwitcher />
          {user ? (
            <>
              <NotificationBell initialUnread={unread} />
              <UserMenu
                user={{ name: user.name, email: user.email, role: user.role }}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("auth.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:scale-[1.03] hover:bg-primary/90 active:scale-95"
              >
                {t("auth.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
