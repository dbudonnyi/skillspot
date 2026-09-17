import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "PROVIDER" ? "/dashboard" : "/search");
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <LoginForm />
      <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted-foreground">
        Demo accounts — parent: <code>parent@demo.pl / demo1234</code> · provider:{" "}
        <code>demo@szachtar.pl / demo1234</code>
      </p>
    </div>
  );
}
