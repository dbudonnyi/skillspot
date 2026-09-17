"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          q.trim()
            ? `/search?q=${encodeURIComponent(q.trim())}`
            : "/search"
        );
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Football, piano, swimming near Mokotów…"
          className="h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-base shadow-sm outline-none ring-ring focus-visible:ring-2"
          aria-label="Search activities"
        />
      </div>
      <Button size="lg" className="rounded-xl px-6" type="submit">
        Search
      </Button>
    </form>
  );
}
