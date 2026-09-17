"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setRequestStatusAction } from "@/actions/profile";
import { toast } from "sonner";

export type RequestItem = {
  id: string;
  status: "NEW" | "ACCEPTED" | "DECLINED";
  message: string;
  contactEmail: string;
  contactPhone: string | null;
  requesterName: string;
  requesterEmail: string;
  serviceTitle: string | null;
  createdAt: string;
};

const badgeCls: Record<RequestItem["status"], string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function RequestList({
  requests,
  canAct,
  requesterIsProvider = false,
}: {
  requests: RequestItem[];
  canAct: boolean;
  /** In "my requests" view, the first field is the school name, not a person. */
  requesterIsProvider?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (requests.length === 0)
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        No requests yet.
      </div>
    );

  async function act(id: string, status: "ACCEPTED" | "DECLINED") {
    setBusy(id);
    const res = await setRequestStatusAction(id, status);
    setBusy(null);
    if (res.ok) {
      toast.success(`Request ${status.toLowerCase()}`);
      router.refresh();
    } else toast.error(res.error ?? "Failed");
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <article key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {requesterIsProvider ? `🏫 ${r.requesterName}` : r.requesterName}
            </span>
            <Badge className={badgeCls[r.status]}>{r.status}</Badge>
            {r.serviceTitle && (
              <Badge variant="secondary">{r.serviceTitle}</Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(r.createdAt).toLocaleString("en-GB")}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {r.message}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <a
              href={`mailto:${r.contactEmail}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="size-4" /> {r.contactEmail}
            </a>
            {r.contactPhone && (
              <a
                href={`tel:${r.contactPhone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="size-4" /> {r.contactPhone}
              </a>
            )}
            {canAct && r.status === "NEW" && (
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "ACCEPTED")}
                >
                  <Check className="mr-1 size-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "DECLINED")}
                >
                  <X className="mr-1 size-4" /> Decline
                </Button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
