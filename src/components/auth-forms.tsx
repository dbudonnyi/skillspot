"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loginAction, type AuthResult } from "@/actions/auth";
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

export function LoginForm() {
  const { t } = useT();
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    loginAction,
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
          <CardTitle className="text-2xl tracking-tight">{t("login.welcome")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl"
                data-testid="login-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl"
                data-testid="login-password"
              />
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
            <Button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl"
              size="lg"
            >
              {pending ? t("login.pending") : t("login.submit")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("login.noAccount")}{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t("login.signup")}
              </Link>
            </p>
            <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              {t("login.demoHint")}
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
