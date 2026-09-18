"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useT } from "@/components/locale-provider";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const { t } = useT();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? "/search?q=" + encodeURIComponent(query) : "/search");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="group relative flex items-center rounded-full bg-card shadow-pop ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-primary/40 dark:ring-white/10"
    >
      <Search className="pointer-events-none absolute left-4 size-5 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("home.searchPlaceholder")}
        aria-label={t("home.search")}
        data-testid="search-input"
        className="h-12 w-full bg-transparent pl-12 pr-28 text-base outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="absolute right-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
      >
        {t("home.search")}
      </button>
    </form>
  );
}
