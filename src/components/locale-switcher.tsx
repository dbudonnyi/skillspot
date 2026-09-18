"use client";

import {
  LOCALES,
  LOCALE_NAMES,
  LOCALE_FLAGS,
  type Locale,
} from "@/i18n/dictionary";
import { useT } from "@/components/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const { locale, setLocale, pending, t } = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground outline-none inline-flex items-center gap-1.5"
        aria-label={t("nav.language")}
        data-testid="locale-switcher"
      >
        <Languages className="size-4" />
        <span className="uppercase text-xs font-semibold">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
          {LOCALES.map((l: Locale) => (
            <DropdownMenuItem
              key={l}
              onClick={() => setLocale(l)}
              data-active={l === locale}
              className={l === locale ? "font-semibold" : ""}
            >
              <span className="mr-2">{LOCALE_FLAGS[l]}</span>
              {LOCALE_NAMES[l]}
              {pending && l === locale ? " …" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
