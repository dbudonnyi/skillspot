"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, ImagePlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/geo";
import { useT } from "@/components/locale-provider";
import { updateProviderProfileAction, type ActionResult } from "@/actions/profile";
import { toast } from "sonner";

const MAX_FILE = 5 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

type ProfileData = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  booksy: string | null;
  minAge: number;
  maxAge: number;
  priceFrom: number | null;
  priceUnit: string;
  coverImage: string | null;
  gallery: string[];
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ProviderProfileForm({ profile }: { profile: ProfileData }) {
  const { t } = useT();
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    profile.coverImage
  );
  const [coverData, setCoverData] = useState<string>("");
  const [galleryData, setGalleryData] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(updateProviderProfileAction, null);
  const router = useRouter();

  /* eslint-disable react-hooks/set-state-in-effect -- resetting form state on actionResult is the canonical useActionState pattern */
  useEffect(() => {
    if (state?.ok) {
      setGalleryData([]);
      toast.success(t("dash.savedToast"));
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <form
      action={async (fd) => {
        if (coverData) fd.set("coverImageFile", coverData);
        if (galleryData.length)
          fd.set(
            "galleryFiles",
            JSON.stringify([...profile.gallery, ...galleryData])
          );
        await formAction(fd);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="coverImage" defaultValue={profile.coverImage ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("dash.name")} name="name" defaultValue={profile.name} />
        <div className="space-y-1.5">
          <Label htmlFor="category">{t("dash.category")}</Label>
          <select
            id="category"
            name="category"
            defaultValue={profile.category}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t("cat." + c)}
              </option>
            ))}
          </select>
        </div>
        <Field
          label={t("dash.subcategory")}
          name="subcategory"
          defaultValue={profile.subcategory}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("dash.minAge")} name="minAge" type="number" defaultValue={profile.minAge} />
          <Field label={t("dash.maxAge")} name="maxAge" type="number" defaultValue={profile.maxAge} />
        </div>
        <Field
          label={t("dash.priceFrom")}
          name="priceFrom"
          type="number"
          defaultValue={profile.priceFrom}
        />
        <Field label={t("dash.price")} name="priceUnit" defaultValue={profile.priceUnit} placeholder="per lesson / per month" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("dash.desc")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          minLength={20}
          required
          defaultValue={profile.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("dash.address")} name="address" defaultValue={profile.address} />
        <Field label="lat" name="lat" type="number" defaultValue={profile.lat} />
        <Field label="lng" name="lng" type="number" defaultValue={profile.lng} />
      </div>
      <p className="-mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3" /> {t("dash.tipCoords")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("dash.phone")} name="phone" defaultValue={profile.phone} placeholder="+48 …" />
        <Field label={t("dash.email")} name="email" type="email" defaultValue={profile.email} />
        <Field label={t("dash.website")} name="website" defaultValue={profile.website} placeholder="https://…" />
        <Field label={t("dash.instagram")} name="instagram" defaultValue={profile.instagram} placeholder="https://instagram.com/…" />
        <Field label={t("dash.facebook")} name="facebook" defaultValue={profile.facebook} placeholder="https://facebook.com/…" />
        <Field label={t("dash.booksy")} name="booksy" defaultValue={profile.booksy} placeholder="https://booksy.com/…" />
      </div>

      {/* Cover */}
      <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
        <div>
          <Label className="mb-1.5 block">{t("dash.cover")}</Label>
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
            {coverPreview ? (
              <Image src={coverPreview} alt="cover" fill sizes="240px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {t("dash.noCover")}
              </div>
            )}
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > MAX_FILE) return toast.error("Max 5 MB");
              const d = await fileToDataUrl(f);
              setCoverData(d);
              setCoverPreview(d);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => coverRef.current?.click()}
          >
            <ImagePlus className="mr-2 size-4" /> {t("dash.changeCover")}
          </Button>
        </div>
        <div>
          <Label className="mb-1.5 block">
            {t("dash.gallery")} ({profile.gallery.length + galleryData.length})
          </Label>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              if (!e.target.files) return;
              const next: string[] = [];
              for (const f of Array.from(e.target.files).slice(
                0,
                Math.max(0, 12 - profile.gallery.length - galleryData.length)
              )) {
                if (f.size > MAX_FILE) continue;
                next.push(await fileToDataUrl(f));
              }
              setGalleryData((g) => [...g, ...next]);
            }}
          />
          <div className="grid grid-cols-4 gap-1.5">
            {[...profile.gallery, ...galleryData].slice(0, 12).map((g, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image src={g} alt={`g${i}`} fill sizes="100px" className="object-cover" unoptimized />
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} size="lg">
        <Save className="mr-2 size-4" /> {pending ? t("dash.saving") : t("dash.save")}
      </Button>
    </form>
  );
}
