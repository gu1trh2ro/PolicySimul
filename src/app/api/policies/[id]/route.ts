import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PolicyTemplateSaveSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 60);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = await prisma.policyTemplate.findUnique({ where: { id: params.id } });
  if (!t || t.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...t, params: JSON.parse(t.params) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 30);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = await prisma.policyTemplate.findUnique({ where: { id: params.id } });
  if (!t || t.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json();
  const parsed = PolicyTemplateSaveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const { name, params: paramsJson } = parsed.data;
  const updated = await prisma.policyTemplate.update({ where: { id: params.id }, data: { name, params: JSON.stringify(paramsJson) } });
  return NextResponse.json({ ...updated, params: JSON.parse(updated.params) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const rl = rateLimit(req, 60_000, 30);
  if (rl.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rl.headers });
  const sess = await requireSession(req);
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = await prisma.policyTemplate.findUnique({ where: { id: params.id } });
  if (!t || t.ownerId !== sess.sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.policyTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


