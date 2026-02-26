import { NextRequest, NextResponse } from "next/server";

import { applyRateLimit, getClientIp, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_LENGTH = 200;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = applyRateLimit(ip, 30);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }
  const apiKey =
    process.env.GOOGLE_PLACES_SERVER_KEY ??
    process.env.MAPS_API ??
    process.env.NEXT_PUBLIC_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "Missing Places API key" } },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { input } = body as { input?: string };

  if (!input || typeof input !== "string" || !input.trim()) {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: { message: `Input must be ${MAX_INPUT_LENGTH} characters or fewer` } },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      input: input.trim(),
      key: apiKey,
      components: "country:us",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Places API returned ${response.status}`);
    }

    interface AutocompletePrediction {
      description?: string;
      place_id?: string;
    }

    interface GoogleAutocompleteResponse {
      status?: string;
      predictions?: AutocompletePrediction[];
    }

    const data = (await response.json()) as GoogleAutocompleteResponse;

    const predictions = (data.predictions ?? [])
      .slice(0, 5)
      .map((p) => ({
        description: p.description,
        placeId: p.place_id,
      }));

    return NextResponse.json({ predictions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Autocomplete failed",
        },
      },
      { status: 500 }
    );
  }
}
