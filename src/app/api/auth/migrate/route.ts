import { NextRequest, NextResponse } from "next/server";
import { getSession as getUnifiedSession } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const nextAuth = await getServerSession(authOptions);
    const unified = await getUnifiedSession(req);
    // Need both: a NextAuth user and a guest cookie session (sub starts with guest_)
    const userId = (nextAuth as any)?.userId as string | undefined;
    const guestId = unified?.sub?.startsWith("guest_") ? unified.sub : undefined;
    if (!userId || !guestId) return NextResponse.json({ ok: true, migrated: false });
    // Reassign all guest-owned resources to user
    await prisma.$transaction([
      prisma.scenario.updateMany({ where: { ownerId: guestId }, data: { ownerId: userId } }),
      prisma.policyTemplate.updateMany({ where: { ownerId: guestId }, data: { ownerId: userId } })
    ]);
    return NextResponse.json({ ok: true, migrated: true });
  } catch (e) {
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}






