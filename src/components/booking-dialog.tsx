"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBookingRequestAction, type ActionResult } from "@/actions/profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { toast } from "sonner";

export function BookingDialog({
  profileId,
  profileName,
  services,
  signedIn,
  isOwner,
}: {
  profileId: string;
  profileName: string;
  services: { id: string; title: string; price: number }[];
  signedIn: boolean;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    submitBookingRequestAction,
    null
  );

  /* eslint-disable react-hooks/set-state-in-effect -- closing dialog on actionResult is the canonical useActionState pattern */
  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      toast.success("Request sent! The provider was notified by email and in-app.");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full gap-1.5 [&_svg]:size-4"
        )}
      >
        <CalendarCheck /> Request to join
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact {profileName}</DialogTitle>
          <DialogDescription>
            Send a booking request — the provider gets an email and an in-app
            notification.
          </DialogDescription>
        </DialogHeader>
        {!signedIn ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please log in to send a request.
            </p>
            <Button onClick={() => router.push("/login")}>Log in</Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="profileId" value={profileId} />
            {services.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="svc">Class (optional)</Label>
                <select
                  id="svc"
                  name="serviceId"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="">General inquiry</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.price} zł
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <Textarea
                id="msg"
                name="message"
                required
                minLength={10}
                rows={4}
                placeholder="Hi! I'm interested in classes for my 7-year-old son. What groups have open spots?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ce">Contact email</Label>
                <Input id="ce" name="contactEmail" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp">Phone (optional)</Label>
                <Input id="cp" name="contactPhone" type="tel" placeholder="+48 …" />
              </div>
            </div>
            {state?.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {state.error}
              </p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="w-full"
              formNoValidate={false}
            >
              {pending ? "Sending…" : "Send request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
