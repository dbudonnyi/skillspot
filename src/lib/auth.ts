import "server-only";
import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SECRET: string =
  process.env.JWT_SECRET || "insecure-dev-secret-change-me";
export const SESSION_COOKIE = "skillsession";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "PROVIDER";
};

export function signSession(payload: SessionPayload): string {
  const options: SignOptions = { expiresIn: MAX_AGE };
  return jwt.sign(payload, SECRET, options);
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded === "object" && decoded !== null && "sub" in decoded) {
      const d = decoded as jwt.JwtPayload & SessionPayload;
      return { sub: d.sub, email: d.email, name: d.name, role: d.role };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Returns the session payload from the cookie, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Full user record for the current session (fresh from DB), or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { providerProfile: { select: { id: true, slug: true, gallery: true } } },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireProvider() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "PROVIDER" || !user.providerProfile)
    throw new Error("FORBIDDEN");
  return user;
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);
