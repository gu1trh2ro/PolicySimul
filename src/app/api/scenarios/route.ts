import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ScenarioSaveSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 60_000, 60);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.scenario.findMany({ where: { ownerId: sess.sub }, orderBy: { updatedAt: "desc" } });
  const parsed = list.map(s => ({ ...s, payload: JSON.parse(s.payload) }));
  return NextResponse.json(parsed);
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 60_000, 30);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json();
  const parsed = ScenarioSaveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const { name, payload } = parsed.data;
  const created = await prisma.scenario.create({ data: { name, payload: JSON.stringify(payload), ownerId: sess.sub, isPrivate: true } });
  return NextResponse.json({ ...created, payload: JSON.parse(created.payload) });
}


