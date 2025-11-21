import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; start: number };
const ipBuckets = new Map<string, Bucket>();

function ipFrom(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(req: NextRequest, windowMs: number, max: number): { limited: boolean; headers?: Record<string, string> } {
  const ip = ipFrom(req);
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b) {
    ipBuckets.set(ip, { count: 1, start: now });
    return { limited: false };
  }
  if (now - b.start > windowMs) {
    b.start = now;
    b.count = 1;
    return { limited: false };
  }
  b.count += 1;
  if (b.count > max) return { limited: true, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } };
  return { limited: false };
}






