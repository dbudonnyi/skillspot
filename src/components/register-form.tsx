"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function RegisterForm({ initialRole = "USER" }: { initialRole?: "USER" | "PROVIDER" }) {
  const [role, setRole] = useState<"USER" | "PROVIDER">(initialRole);
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join SkillSpot Warsaw — it&apos;s free</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setRole("USER")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              role === "USER" ? "bg-background shadow" : "text-muted-foreground"
            }`}
          >
            👨‍👩‍👧 Parent / Adult
          </button>
          <button
            type="button"
            onClick={() => setRole("PROVIDER")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              role === "PROVIDER" ? "bg-background shadow" : "text-muted-foreground"
            }`}
          >
            🏫 Provider
          </button>
        </div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required placeholder="Anna Kowalska" />
          </div>
          {role === "PROVIDER" && (
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business / club name</Label>
              <Input id="businessName" name="businessName" placeholder="e.g. Little Champions FC" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
