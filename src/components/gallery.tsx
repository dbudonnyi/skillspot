"use client";

import { useState } from "react";
import Image from "next/image";

export function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setOpen(src)}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
          >
            <Image
              src={src}
              alt={`Photo ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-200 hover:scale-105"
              unoptimized
            />
          </button>
        ))}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open}
            alt="Enlarged photo"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          <button
            className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-white"
            onClick={() => setOpen(null)}
          >
            Close ✕
          </button>
        </div>
      )}
    </>
  );
}
