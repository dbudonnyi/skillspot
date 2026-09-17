import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(session.role === "PROVIDER" ? "/dashboard" : "/search");
  const role = sp.role === "PROVIDER" ? "PROVIDER" : "USER";
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <RegisterForm initialRole={role} />
    </div>
  );
}
