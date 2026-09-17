"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/actions/profile";
import { toast } from "sonner";

export function FavoriteButton({
  profileId,
  initialFavorited,
  signedIn,
}: {
  profileId: string;
  initialFavorited: boolean;
  signedIn: boolean;
}) {
  const [fav, setFav] = useState(initialFavorited);
  const router = useRouter();

  return (
    <Button
      variant={fav ? "default" : "outline"}
      size="lg"
      className="w-full"
      onClick={async () => {
        if (!signedIn) {
          toast.error("Please log in to save favorites.");
          router.push("/login");
          return;
        }
        const res = await toggleFavoriteAction(profileId);
        if (res.ok) {
          setFav((v) => !v);
          toast.success(fav ? "Removed from favorites" : "Saved to favorites ❤️");
          router.refresh();
        } else {
          toast.error(res.error);
        }
      }}
    >
      <Heart className={`mr-2 size-4 ${fav ? "fill-white" : ""}`} />
      {fav ? "Saved to favorites" : "Add to favorites"}
    </Button>
  );
}
