"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createSessionCookie,
  destroySessionCookie,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AuthResult = { ok: boolean; error?: string };

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(80),
  role: z.enum(["USER", "PROVIDER"]),
  // Provider-only fields
  businessName: z.string().min(2).max(120).optional().or(z.literal("")),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const fallback = "provider-" + Math.random().toString(36).slice(2, 8);
  return (base || fallback) + "-" + Math.random().toString(36).slice(2, 5);
}

export async function registerAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || "").trim(),
    role: formData.get("role") === "PROVIDER" ? "PROVIDER" : "USER",
    businessName: String(formData.get("businessName") || ""),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.path[0];
    const key =
      first === "email"
        ? "auth.errEmail"
        : first === "password"
          ? "auth.errPass"
          : first === "name"
            ? "auth.errName"
            : "auth.errEmail";
    return { ok: false, error: key };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) return { ok: false, error: "auth.errExists" };

  const user = await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      role: d.role,
      passwordHash: await hashPassword(d.password),
    },
  });

  let onboarding = false;
  if (d.role === "PROVIDER") {
    const businessName =
      d.businessName && d.businessName.length >= 2 ? d.businessName : `${d.name}'s studio`;
    await prisma.providerProfile.create({
      data: {
        ownerId: user.id,
        slug: slugify(businessName),
        name: businessName,
        category: "OTHER",
        description:
          "Welcome to our profile! Tell parents about your classes in the dashboard.",
        address: "Warsaw",
        district: "Śródmieście",
        lat: 52.2297,
        lng: 21.0122,
      },
    });
    onboarding = true;
  }

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  revalidatePath("/", "layout");
  redirect(onboarding ? "/dashboard" : "/search");
}

export async function loginAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { ok: false, error: "auth.errCreds" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // Same error for both cases — don't leak which emails exist.
    return { ok: false, error: "auth.errCreds" };
  }

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  revalidatePath("/", "layout");
  redirect(user.role === "PROVIDER" ? "/dashboard" : "/search");
}

export async function logoutAction() {
  await destroySessionCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function meAction() {
  return getSession();
}
