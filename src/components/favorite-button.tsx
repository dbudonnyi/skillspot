"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/actions/profile";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export function FavoriteButton({
  profileId,
  initialFavorited,
  signedIn,
}: {
  profileId: string;
  initialFavorited: boolean;
  signedIn: boolean;
}) {
  const { t } = useT();
  const [fav, setFav] = useState(initialFavorited);
  const [burst, setBurst] = useState(0);
  const router = useRouter();

  return (
    <Button
      variant={fav ? "default" : "outline"}
      size="lg"
      className="w-full"
      onClick={async () => {
        if (!signedIn) {
          toast.error(t("fav.login"));
          router.push("/login");
          return;
        }
        const res = await toggleFavoriteAction(profileId);
        if (res.ok) {
          setFav((v) => !v);
          setBurst((b) => b + 1);
          toast.success(fav ? t("fav.removedToast") : t("fav.savedToast"));
          router.refresh();
        } else {
          toast.error(res.error);
        }
      }}
    >
      <span key={burst} className="inline-flex animate-[heart-pop_0.35s_ease]">
        <Heart className={`mr-2 size-4 ${fav ? "fill-white" : ""}`} />
      </span>
      {fav ? t("fav.savedShort") : t("fav.add")}
    </Button>
  );
}
