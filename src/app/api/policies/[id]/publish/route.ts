import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 15);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = await prisma.policyTemplate.findUnique({ where: { id: params.id } });
  if (!t || t.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const enable: boolean = body?.enable !== false;
  const updated = await prisma.policyTemplate.update({ where: { id: params.id }, data: { isPublic: enable } });
  return NextResponse.json({ ok: true, isPublic: updated.isPublic });
}






