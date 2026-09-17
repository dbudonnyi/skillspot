import Link from "next/link";
import { MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <span>SkillSpot — activities marketplace, Warsaw PL</span>
        </div>
        <div className="flex gap-4">
          <Link href="/search" className="hover:text-foreground">Discover</Link>
          <Link href="/register?role=PROVIDER" className="hover:text-foreground">
            Add your business
          </Link>
          <span className="text-xs">MVP demo · data from OpenStreetMap & seeded profiles</span>
        </div>
      </div>
    </footer>
  );
}
