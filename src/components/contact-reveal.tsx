"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";

export function ContactReveal({
  phone,
  email,
  signedIn,
}: {
  phone: string | null;
  email: string | null;
  signedIn: boolean;
}) {
  const { t } = useT();
  const [revealed, setRevealed] = useState(false);
  const router = useRouter();

  if (!phone && !email)
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t("contact.none")}
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
            toast.error(t("contact.login"));
            router.push("/login");
            return;
          }
          setRevealed(true);
        }}
      >
        <Eye className="mr-2 size-4" /> {t("contact.show")}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
      data-testid="contacts-revealed"
    >
      {phone && (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Phone className="size-4 text-primary" /> {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Mail className="size-4 text-primary" /> {email}
        </a>
      )}
    </motion.div>
  );
}
