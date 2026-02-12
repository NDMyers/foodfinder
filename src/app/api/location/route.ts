import { NextRequest, NextResponse } from "next/server";

import { fetchNearbyRestaurants, PlacesUpstreamError } from "@/lib/google/placesClient";
import { applyRateLimit, getClientIp, rateLimitResponse } from "@/lib/ratelimit";
import { parseRestaurantsRequest, RequestValidationError } from "@/lib/validation/restaurantsRequest";
import { CUISINES, RADIUS_OPTIONS, type CuisineId, type RadiusMeters, type SortBy } from "@/types/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const radiusSet = new Set<number>(RADIUS_OPTIONS);
const cuisineByLabel = new Map<string, CuisineId>(CUISINES.map((cuisine) => [cuisine.label.toLowerCase(), cuisine.id]));

const deprecationHeaders = {
  Deprecation: "true",
  Sunset: "Wed, 31 Dec 2026 23:59:59 GMT",
  Link: "</api/restaurants>; rel=\"successor-version\"",
};

const parseLegacyCuisineQuery = (value: unknown): CuisineId[] => {
  if (typeof value !== "string" || !value.includes("keyword=")) {
    return [];
  }

  let keywordSection = "";
  try {
    keywordSection = decodeURIComponent(value).replace(/^.*keyword=/, "").trim();
  } catch {
    return [];
  }

  if (!keywordSection || keywordSection.toLowerCase() === "restaurant") {
    return [];
  }

  const parsed = keywordSection
    .split("|")
    .map((entry) => entry.trim().toLowerCase())
    .map((entry) => cuisineByLabel.get(entry))
    .filter((entry): entry is CuisineId => Boolean(entry));

  return Array.from(new Set(parsed));
};

const parseLegacyRadius = (value: unknown): RadiusMeters => {
  const parsed = Number(value);
  if (radiusSet.has(parsed)) {
    return parsed as RadiusMeters;
  }

  return 3000;
};

const parseLegacySort = (value: unknown): SortBy => {
  if (value === "rating") {
    return "rating";
  }

  return "distance";
};

const errorResponse = (status: 400 | 500 | 502, code: string, message: string, details?: string[]) =>
  NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      headers: deprecationHeaders,
    }
  );

export async function GET() {
  return NextResponse.json(
    {
      message: "Legacy endpoint is deprecated. Use POST /api/restaurants.",
    },
    {
      status: 200,
      headers: deprecationHeaders,
    }
  );
}

export async function POST(request: NextRequest) {
  const apiKey =
    process.env.GOOGLE_PLACES_SERVER_KEY ??
    process.env.MAPS_API ??
    process.env.NEXT_PUBLIC_MAPS_API_KEY;
  if (!apiKey) {
    return errorResponse(
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

  let legacyBody: Record<string, unknown>;
  try {
    legacyBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  try {
    const adaptedRequest = parseRestaurantsRequest({
      latitude: legacyBody.latitude,
      longitude: legacyBody.longitude,
      radiusMeters: parseLegacyRadius(legacyBody.radius ?? legacyBody.radiusMeters),
      cuisines: parseLegacyCuisineQuery(legacyBody.cuisinesQuery),
      openNow: legacyBody.openNow ?? true,
      sortBy: parseLegacySort(legacyBody.sortBy),
    });

    const restaurants = await fetchNearbyRestaurants(adaptedRequest, apiKey);
    const legacyResults = restaurants.map((restaurant) => ({
      place_id: restaurant.id,
      name: restaurant.name,
      vicinity: restaurant.address,
      geometry: {
        location: {
          lat: restaurant.location.latitude,
          lng: restaurant.location.longitude,
        },
      },
      rating: restaurant.rating ?? undefined,
    }));

    return NextResponse.json(
      {
        results: legacyResults,
      },
      {
        status: 200,
        headers: deprecationHeaders,
      }
    );
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(400, "INVALID_REQUEST", "Invalid legacy payload.", error.issues);
    }

    if (error instanceof PlacesUpstreamError) {
      return errorResponse(502, "UPSTREAM_ERROR", error.message);
    }

    return errorResponse(500, "UNEXPECTED_ERROR", "Unexpected server error.");
  }
}
