"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  upsertServiceAction,
  deleteServiceAction,
  type ActionResult,
} from "@/actions/profile";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

type Svc = {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  ageMin: number;
  ageMax: number;
};

export function ServicesManager({
  profileId,
  services,
}: {
  profileId: string;
  services: Svc[];
}) {
  const { t } = useT();
  const [editing, setEditing] = useState<Svc | "new" | null>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(upsertServiceAction, null);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting form state on actionResult is the canonical useActionState pattern */
  useEffect(() => {
    if (state?.ok) {
      setEditing(null);
      toast.success(t("dash.savedToast"));
      router.refresh();
    } else if (state?.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (editing) {
    const s = editing === "new" ? null : editing;
    return (
      <form action={formAction} className="space-y-3 rounded-lg border p-4">
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="serviceId" value={s?.id ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-title">{t("dash.serviceTitle")}</Label>
            <Input id="s-title" name="title" required minLength={3} defaultValue={s?.title} placeholder="Football kids 6–9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-price">{t("dash.price")}</Label>
              <Input id="s-price" name="price" type="number" min={0} required defaultValue={s?.price ?? 100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-unit">z\u0142 /</Label>
              <Input id="s-unit" name="priceUnit" defaultValue={s?.priceUnit ?? "per lesson"} />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-desc">{t("dash.serviceDesc")}</Label>
          <Textarea id="s-desc" name="description" required minLength={10} rows={3} defaultValue={s?.description} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
          <div className="space-y-1.5">
            <Label htmlFor="s-min">{t("dash.ageFrom")}</Label>
            <Input id="s-min" name="ageMin" type="number" min={0} max={18} defaultValue={s?.ageMin ?? 6} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-max">{t("dash.ageTo")}</Label>
            <Input id="s-max" name="ageMax" type="number" min={3} max={99} defaultValue={s?.ageMax ?? 12} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("dash.saving") : t("dash.saveClass")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            {t("dash.cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {services.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No classes yet — add your first offer.
        </p>
      )}
      {services.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <div className="font-medium">{s.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {s.description}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Ages {s.ageMin}–{s.ageMax}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-semibold">{s.price} zł</div>
            <div className="text-xs text-muted-foreground">{s.priceUnit}</div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={async () => {
                if (!confirm(`Delete "${s.title}"?`)) return;
                const res = await deleteServiceAction(s.id);
                if (res.ok) {
                  toast.success(t("dash.deleted"));
                  router.refresh();
                } else toast.error(res.error);
              }}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={() => setEditing("new")}>
        <Plus className="mr-2 size-4" /> {t("dash.addService")}
      </Button>
    </div>
  );
}
