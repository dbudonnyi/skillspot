import Link from "next/link";
import { MapPin } from "lucide-react";
import { getDict } from "@/i18n/server";
import { tr } from "@/i18n/dictionary";

export async function SiteFooter() {
  const dict = await getDict();
  const t = (k: string) => tr(dict, k);
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <span>{t("footer.tagline")}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="hover:text-foreground">{t("nav.discover")}</Link>
          <Link href="/register?role=PROVIDER" className="hover:text-foreground">
            {t("footer.addBusiness")}
          </Link>
          <span className="text-xs">{t("footer.note")}</span>
        </div>
      </div>
    </footer>
  );
}
