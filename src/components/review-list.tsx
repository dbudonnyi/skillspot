"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Stars } from "@/components/stars";

export type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  photos: string[];
  userName: string;
  createdAt: string;
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (reviews.length === 0)
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No reviews yet — be the first to share your experience!
      </div>
    );

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const d = new Date(r.createdAt);
        const long = r.text.length > 220;
        const open = expanded === r.id;
        return (
          <article key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {r.userName
                    .split(/\s+/)
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{r.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {d.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="ml-auto">
                <Stars value={r.rating} showValue={false} />
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
              {long && !open ? r.text.slice(0, 220) + "…" : r.text}
              {long && (
                <button
                  className="ml-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => setExpanded(open ? null : r.id)}
                >
                  {open ? "Show less" : "Read more"}
                </button>
              )}
            </p>
            {r.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {r.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    <Image src={p} alt="review photo" fill sizes="80px" className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
