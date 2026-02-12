import { NextRequest, NextResponse } from "next/server";

import { fetchNearbyRestaurants, PlacesUpstreamError } from "@/lib/google/placesClient";
import { parseRestaurantsRequest, RequestValidationError } from "@/lib/validation/restaurantsRequest";
import type { RestaurantsResponse } from "@/types/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 50;
const rateLimitStore = new Map<string, RateLimitEntry>();

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
};

const applyRateLimit = (ip: string): { allowed: boolean; retryAfterSeconds?: number } => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  rateLimitStore.set(ip, record);
  return { allowed: true };
};

const createErrorResponse = (
  status: 400 | 405 | 429 | 500 | 502,
  code: string,
  message: string,
  details?: string[]
): NextResponse => {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.MAPS_API;
  if (!apiKey) {
    return createErrorResponse(
      500,
      "SERVER_MISCONFIGURATION",
      "Missing Places API key. Set MAPS_API (or GOOGLE_PLACES_SERVER_KEY)."
    );
  }

  const ip = getClientIp(request);
  const rateLimit = applyRateLimit(ip);
  if (!rateLimit.allowed) {
    const response = createErrorResponse(429, "RATE_LIMITED", "Too many requests. Please try again shortly.");
    if (rateLimit.retryAfterSeconds) {
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  try {
    const parsedRequest = parseRestaurantsRequest(body);
    const restaurants = await fetchNearbyRestaurants(parsedRequest, apiKey);

    const payload: RestaurantsResponse = {
      restaurants,
      meta: {
        total: restaurants.length,
        source: "google-places",
        fetchedAt: new Date().toISOString(),
      },
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.headers.set("Cache-Control", "private, max-age=20, stale-while-revalidate=40");
    response.headers.set("Vary", "x-forwarded-for");
    return response;
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return createErrorResponse(400, "INVALID_REQUEST", "Invalid restaurant search payload.", error.issues);
    }

    if (error instanceof PlacesUpstreamError) {
      return createErrorResponse(502, "UPSTREAM_ERROR", error.message);
    }

    return createErrorResponse(500, "UNEXPECTED_ERROR", "Unexpected server error.");
  }
}

export async function GET() {
  const response = createErrorResponse(405, "METHOD_NOT_ALLOWED", "Use POST /api/restaurants.");
  response.headers.set("Allow", "POST");
  return response;
}
