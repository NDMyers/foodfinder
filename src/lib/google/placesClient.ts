import { CUISINE_KEYWORDS } from "@/types/filters";
import type { CuisineId, SortBy } from "@/types/filters";
import { haversineDistanceMeters } from "@/lib/restaurants/distance";
import type { RestaurantCard, RestaurantsRequest } from "@/types/restaurant";

const GOOGLE_NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const REQUEST_TIMEOUT_MS = 9_000;

interface GoogleNearbySearchResult {
  place_id: string;
  name?: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
}

interface GoogleNearbySearchResponse {
  status?: string;
  error_message?: string;
  results?: GoogleNearbySearchResult[];
}

export class PlacesUpstreamError extends Error {
  public readonly statusCode: 502 | 500;
  public readonly upstreamStatus?: string;

  constructor(message: string, options?: { statusCode?: 502 | 500; upstreamStatus?: string }) {
    super(message);
    this.name = "PlacesUpstreamError";
    this.statusCode = options?.statusCode ?? 502;
    this.upstreamStatus = options?.upstreamStatus;
  }
}

const buildCuisineKeywordQuery = (cuisines: CuisineId[]): string | null => {
  if (!cuisines.length) {
    return null;
  }

  return cuisines.map((cuisine) => CUISINE_KEYWORDS[cuisine]).join(" ");
};

const parseGoogleResponse = (payload: unknown): GoogleNearbySearchResponse => {
  if (!payload || typeof payload !== "object") {
    throw new PlacesUpstreamError("Google Places returned an invalid response payload.");
  }

  return payload as GoogleNearbySearchResponse;
};

const isGoogleSuccessStatus = (status: string | undefined): status is "OK" | "ZERO_RESULTS" => {
  return status === "OK" || status === "ZERO_RESULTS";
};

const normalizeRestaurant = (result: GoogleNearbySearchResult, request: RestaurantsRequest): RestaurantCard | null => {
  if (!result.place_id || !result.name) {
    return null;
  }

  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return {
    id: result.place_id,
    name: result.name,
    address: result.vicinity ?? "Address unavailable",
    location: {
      latitude: lat,
      longitude: lng,
    },
    rating: typeof result.rating === "number" ? result.rating : null,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
    priceLevel: typeof result.price_level === "number" ? result.price_level : null,
    openNow: typeof result.opening_hours?.open_now === "boolean" ? result.opening_hours.open_now : null,
    distanceMeters: haversineDistanceMeters(request.latitude, request.longitude, lat, lng),
    mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  };
};

const sortRestaurants = (restaurants: RestaurantCard[], sortBy: SortBy): RestaurantCard[] => {
  if (sortBy === "rating") {
    return [...restaurants].sort((left, right) => {
      const leftRating = left.rating ?? -1;
      const rightRating = right.rating ?? -1;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      const leftVotes = left.userRatingsTotal ?? -1;
      const rightVotes = right.userRatingsTotal ?? -1;
      if (rightVotes !== leftVotes) {
        return rightVotes - leftVotes;
      }

      return (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (right.distanceMeters ?? Number.MAX_SAFE_INTEGER);
    });
  }

  return [...restaurants].sort(
    (left, right) => (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (right.distanceMeters ?? Number.MAX_SAFE_INTEGER)
  );
};

export const fetchNearbyRestaurants = async (
  request: RestaurantsRequest,
  apiKey: string
): Promise<RestaurantCard[]> => {
  const params = new URLSearchParams({
    location: `${request.latitude},${request.longitude}`,
    radius: String(request.radiusMeters),
    type: "restaurant",
    key: apiKey,
  });

  if (request.openNow) {
    params.set("opennow", "true");
  }

  const cuisineKeyword = buildCuisineKeywordQuery(request.cuisines);
  if (cuisineKeyword) {
    params.set("keyword", cuisineKeyword);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${GOOGLE_NEARBY_SEARCH_URL}?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PlacesUpstreamError("Google Places request timed out.");
    }

    throw new PlacesUpstreamError("Google Places request failed.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new PlacesUpstreamError(`Google Places returned HTTP ${response.status}.`);
  }

  const payload = parseGoogleResponse(await response.json());
  if (!isGoogleSuccessStatus(payload.status)) {
    throw new PlacesUpstreamError(payload.error_message ?? "Google Places returned a non-success status.", {
      upstreamStatus: payload.status,
    });
  }

  const normalized = (payload.results ?? [])
    .map((result) => normalizeRestaurant(result, request))
    .filter((restaurant): restaurant is RestaurantCard => restaurant !== null);

  const uniqueById = Array.from(new Map(normalized.map((restaurant) => [restaurant.id, restaurant])).values());
  return sortRestaurants(uniqueById, request.sortBy);
};
