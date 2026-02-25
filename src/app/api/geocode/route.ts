import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function POST(request: NextRequest) {
  const apiKey =
    process.env.GOOGLE_PLACES_SERVER_KEY ??
    process.env.MAPS_API ??
    process.env.NEXT_PUBLIC_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "Missing Geocoding API key" } },
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

  const { address } = body as { address?: string };

  if (!address || typeof address !== "string" || !address.trim()) {
    return NextResponse.json(
      { error: { message: "Address is required" } },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      address: address.trim(),
      key: apiKey,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    interface GeocodeResult {
      geometry?: {
        location?: {
          lat?: number;
          lng?: number;
        };
      };
      formatted_address?: string;
    }

    interface GoogleGeocodeResponse {
      status?: string;
      results?: GeocodeResult[];
    }

    const data = (await response.json()) as GoogleGeocodeResponse;

    if (data.status !== "OK" || !data.results?.[0]) {
      return NextResponse.json(
        { error: { message: "Address not found" } },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const lat = result.geometry?.location?.lat;
    const lng = result.geometry?.location?.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      throw new Error("Invalid coordinates in response");
    }

    const payload: GeocodeResponse = {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address || address,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Geocoding failed",
        },
      },
      { status: 500 }
    );
  }
}
