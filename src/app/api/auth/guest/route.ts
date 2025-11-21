import { NextRequest, NextResponse } from "next/server";
import { createGuestSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const nickname = typeof body?.nickname === "string" ? body.nickname.slice(0, 32) : undefined;
    const token = await createGuestSession(nickname);
    await setSessionCookie(token);
    const res = NextResponse.json({ ok: true, nickname });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Failed to create guest session" }, { status: 500 });
  }
}






