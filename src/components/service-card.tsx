"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Translatable } from "@/components/translatable";
import { useT } from "@/components/locale-provider";

export function ServiceCard({
  title,
  description,
  price,
  priceUnit,
  ageMin,
  ageMax,
}: {
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  ageMin: number;
  ageMax: number;
}) {
  const { t } = useT();
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
          <Translatable text={description} className="mt-1 text-sm leading-relaxed text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            {t("profile.agesTo", { min: ageMin, max: ageMax })}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold">{price} z\u0142</div>
          <div className="text-xs text-muted-foreground">{priceUnit}</div>
        </div>
      </CardContent>
    </Card>
  );
}
