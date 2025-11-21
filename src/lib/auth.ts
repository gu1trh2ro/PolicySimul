import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";

const COOKIE_NAME = "ps_session";
const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
  return encoder.encode(secret);
}

export type SessionPayload = { sub: string; nickname?: string };

export async function createGuestSession(nickname?: string): Promise<string> {
  const id = `guest_${Math.random().toString(36).slice(2)}`;
  const token = await new SignJWT({ nickname } as SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  try {
    // Prefer NextAuth session if present
    const na = await getServerSession(authOptions);
    if (na && (na as any).userId) {
      return { sub: String((na as any).userId), nickname: na.user?.name ?? undefined };
    }
    const token = req ? req.cookies.get(COOKIE_NAME)?.value : (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return { sub: String(payload.sub), nickname: (payload as any).nickname };
  } catch {
    return null;
  }
}

export async function requireSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = await getSession(req);
  return session;
}


