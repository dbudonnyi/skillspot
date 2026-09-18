"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { useT } from "@/components/locale-provider";

export function RegisterForm({ initialRole = "USER" }: { initialRole?: "USER" | "PROVIDER" }) {
  const { t } = useT();
  const [role, setRole] = useState<"USER" | "PROVIDER">(initialRole);
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    registerAction,
    null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.15 }}
      className="mx-auto w-full max-w-md"
    >
      <Card className="rounded-3xl shadow-pop border-black/5 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["USER", "PROVIDER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (role === r ? "text-foreground" : "text-muted-foreground")
                }
              >
                {role === r && (
                  <motion.span
                    layoutId="role-pill"
                    className="absolute inset-0 rounded-lg bg-background shadow"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10">
                  {r === "USER" ? "\ud83d\udc68\ud83d\udc69\ud83d\udc67 " : "\ud83c\udfeb "}
                  {t(r === "USER" ? "register.roleUser" : "register.roleProvider")}
                </span>
              </button>
            ))}
          </div>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="role" value={role} />
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("register.yourName")}</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder={t("register.namePlaceholder")}
                className="h-11 rounded-xl"
              />
            </div>
            {role === "PROVIDER" && (
              <div className="space-y-1.5">
                <Label htmlFor="businessName">{t("register.businessName")}</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder={t("register.businessPlaceholder")}
                  className="h-11 rounded-xl"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl"
                data-testid="register-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 rounded-xl"
                data-testid="register-password"
              />
              <p className="text-xs text-muted-foreground">{t("register.passwordHint")}</p>
            </div>
            {state?.error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
                data-testid="form-error"
              >
                {t(state.error)}
              </motion.p>
            )}
            <Button type="submit" disabled={pending} className="w-full rounded-xl" size="lg">
              {pending ? t("register.pending") : t("register.submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("register.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
