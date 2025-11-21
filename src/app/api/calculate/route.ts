import { NextRequest, NextResponse } from "next/server";
import { CalculationInputSchema } from "@/lib/schemas";
import { evaluateLoanScenario } from "@/lib/calc";

// Basic in-memory rate limiter per IP (sliding window)
// Note: for serverless this may reset between invocations. For production, use a shared store (Redis).
const windowMs = 60_000; // 1 minute
const maxPerWindow = 60; // 60 requests / minute
type Bucket = { count: number; start: number };
const ipBuckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // nextjs dev server fallback
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket) {
    ipBuckets.set(ip, { count: 1, start: now });
    return false;
  }
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 1;
    return false;
  }
  bucket.count += 1;
  return bucket.count > maxPerWindow;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } }
      );
    }

    const json = await req.json();
    const parsed = CalculationInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = evaluateLoanScenario(parsed.data);
    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}


