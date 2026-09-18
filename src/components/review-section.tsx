"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Camera, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction, type ActionResult } from "@/actions/profile";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

const MAX_FILE = 5 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ReviewSection({
  profileId,
  signedIn,
  isOwner,
  hasReviewed,
  ratingAvg,
  ratingCount,
}: {
  profileId: string;
  profileSlug: string;
  signedIn: boolean;
  isOwner: boolean;
  hasReviewed: boolean;
  ratingAvg: number;
  ratingCount: number;
}) {
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(submitReviewAction, null);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting form state on actionResult is the canonical useActionState pattern */
  useEffect(() => {
    if (state?.ok) {
      setPhotos([]);
      setRating(0);
      toast.success(t("review.published"));
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dist = [5, 4, 3, 2, 1].map((s) =>
    Math.floor(
      ratingCount * (s === 5 ? 0.55 : s === 4 ? 0.25 : s === 3 ? 0.1 : 0.05)
    )
  );

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next: string[] = [];
    for (const f of Array.from(files).slice(0, 6 - photos.length)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_FILE) {
        toast.error(f.name + ": max 5 MB");
        continue;
      }
      next.push(await fileToDataUrl(f));
    }
    setPhotos((p) => [...p, ...next].slice(0, 6));
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-lg">{t("review.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-muted/50 p-3">
          <div className="text-center">
            <div className="text-3xl font-extrabold">
              {ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("profile.reviews")} ({ratingCount})
            </div>
          </div>
          <div className="flex-1 space-y-0.5">
            {dist.map((c, i) => {
              const stars = 5 - i;
              const pct = ratingCount
                ? Math.min(100, (c / ratingCount) * 100)
                : 0;
              return (
                <div
                  key={stars}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  <span>{stars}★</span>
                  <div className="h-1.5 flex-1 rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isOwner ? (
          <p className="text-sm text-muted-foreground">
            {t("review.own")}
          </p>
        ) : !signedIn ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{t("review.loginText")}</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              {t("review.loginBtn")}
            </Button>
          </div>
        ) : hasReviewed ? (
          <p className="text-sm text-muted-foreground">
            {t("review.already")}
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="profileId" value={profileId} />
            <input type="hidden" name="rating" value={rating || ""} />
            {photos.length > 0 && (
              <input
                type="hidden"
                name="photos"
                value={JSON.stringify(photos)}
              />
            )}
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  className="p-0.5"
                  aria-label={String(s)}
                >
                  <Star
                    className={`size-7 transition-colors ${
                      (hover || rating) >= s
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating < 1 && (
              <p className="text-xs text-amber-600">
                {t("review.pickStars")}
              </p>
            )}
            <Textarea
              name="text"
              required
              minLength={10}
              rows={4}
              placeholder={t("review.placeholder")}
            />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => onFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={photos.length >= 6}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="mr-2 size-4" /> {t("review.photos", { n: photos.length })}
              </Button>
              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-md"
                    >
                      <Image
                        src={p}
                        alt={`upload ${i + 1}`}
                        fill
                        sizes="100px"
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                        onClick={() =>
                          setPhotos((ps) => ps.filter((_, j) => j !== i))
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {state?.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t("review.publishing") : t("review.publish")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
