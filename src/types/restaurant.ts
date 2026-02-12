import type { CuisineId, SortBy } from "@/types/filters";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RestaurantsRequest {
  latitude: number;
  longitude: number;
  radiusMeters: 1500 | 3000 | 4500 | 6000;
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
