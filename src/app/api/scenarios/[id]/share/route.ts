import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

function genShareId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sc = await prisma.scenario.findUnique({ where: { id: params.id } });
  if (!sc || sc.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json().catch(() => ({}));
  const enable: boolean = json?.enable !== false;
  const shareId = enable ? sc.shareId ?? genShareId() : null;
  const updated = await prisma.scenario.update({ where: { id: sc.id }, data: { isPrivate: !enable, shareId: shareId ?? undefined } });
  const url = enable && shareId ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/share/${shareId}` : null;
  return NextResponse.json({ ok: true, shareId: updated.shareId, url });
}






