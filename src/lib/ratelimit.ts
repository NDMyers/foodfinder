import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 50;

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function applyRateLimit(
  ip: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.windowStartedAt >= windowMs) {
    rateLimitStore.set(ip, { count: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.windowStartedAt + windowMs - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  rateLimitStore.set(ip, record);
  return { allowed: true };
}

export function rateLimitResponse(retryAfterSeconds?: number): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
      },
    },
    { status: 429 }
  );
  if (retryAfterSeconds) {
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
