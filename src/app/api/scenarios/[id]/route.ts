import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ScenarioSaveSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 60);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sc = await prisma.scenario.findUnique({ where: { id: params.id } });
  if (!sc || sc.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sc);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 30);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sc = await prisma.scenario.findUnique({ where: { id: params.id } });
  if (!sc || sc.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json();
  const parsed = ScenarioSaveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const { name, payload } = parsed.data;
  const updated = await prisma.scenario.update({ where: { id: params.id }, data: { name, payload } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sc = await prisma.scenario.findUnique({ where: { id: params.id } });
  if (!sc || sc.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.scenario.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


