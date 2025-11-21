import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 60_000, 60);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const list = await prisma.policyTemplate.findMany({ where: { isPublic: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(list);
}






