import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  const sc = await prisma.scenario.findFirst({ where: { shareId: params.shareId, isPrivate: false } });
  if (!sc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: sc.id, name: sc.name, payload: sc.payload, shared: true });
}






