import { NextRequest, NextResponse } from "next/server";

import { fetchNearbyRestaurants, PlacesUpstreamError } from "@/lib/google/placesClient";
import { applyRateLimit, getClientIp, rateLimitResponse } from "@/lib/ratelimit";
import { parseRestaurantsRequest, RequestValidationError } from "@/lib/validation/restaurantsRequest";
import type { RestaurantsResponse } from "@/types/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createErrorResponse = (
  status: 400 | 405 | 500 | 502,
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
  const apiKey =
    process.env.GOOGLE_PLACES_SERVER_KEY ??
    process.env.MAPS_API ??
    process.env.NEXT_PUBLIC_MAPS_API_KEY;
  if (!apiKey) {
    return createErrorResponse(
      500,
      "SERVER_MISCONFIGURATION",
      "Missing Places API key. Set MAPS_API, GOOGLE_PLACES_SERVER_KEY, or NEXT_PUBLIC_MAPS_API_KEY."
    );
  }

  const ip = getClientIp(request);
  const rateLimit = applyRateLimit(ip);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
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
