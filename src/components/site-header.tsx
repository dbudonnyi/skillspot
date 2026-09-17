import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";

export function SiteHeader({
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
  return (
    <header className="sticky top-0 z-[1100] border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span>
            Skill<span className="text-primary">Spot</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/search"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Discover
          </Link>
          <Link
            href="/search?sort=rating"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Top rated
          </Link>
          {user?.role === "USER" && (
            <Link
              href="/favorites"
              className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Favorites
            </Link>
          )}
          {user?.role === "PROVIDER" && (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
          {user?.role === "PROVIDER" && user.profileSlug && (
            <Link
              href={`/provider/${user.profileSlug}`}
              className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              My public page
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
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
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
