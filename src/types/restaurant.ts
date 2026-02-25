import type { CuisineId, RadiusMeters, SortBy } from "@/types/filters";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RestaurantsRequest {
  latitude: number;
  longitude: number;
  radiusMeters: RadiusMeters;
  cuisines: CuisineId[];
  openNow: boolean;
  sortBy: SortBy;
}

export interface RestaurantCard {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  rating: number | null;
  userRatingsTotal: number | null;
  priceLevel: number | null;
  openNow: boolean | null;
  distanceMeters: number | null;
  mapsUrl: string;
}

export interface RestaurantsResponse {
  restaurants: RestaurantCard[];
  meta: {
    total: number;
    source: "google-places";
    fetchedAt: string;
  };
}
