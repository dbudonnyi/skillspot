"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ContactReveal({
  phone,
  email,
  signedIn,
}: {
  phone: string | null;
  email: string | null;
  signedIn: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const router = useRouter();

  if (!phone && !email)
    return (
      <p className="text-center text-sm text-muted-foreground">
        No direct contacts published — use the booking request instead.
      </p>
    );

  if (!revealed) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => {
          if (!signedIn) {
            toast.error("Log in to view contact details.");
            router.push("/login");
            return;
          }
          setRevealed(true);
        }}
      >
        <Eye className="mr-2 size-4" /> Show contact
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {phone && (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Phone className="size-4 text-primary" /> {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Mail className="size-4 text-primary" /> {email}
        </a>
      )}
    </div>
  );
}
