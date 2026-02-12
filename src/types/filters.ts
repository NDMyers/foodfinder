export const RADIUS_OPTIONS = [1500, 3000, 4500, 6000] as const;

export type RadiusMeters = (typeof RADIUS_OPTIONS)[number];

export const SORT_OPTIONS = ["distance", "rating"] as const;

export type SortBy = (typeof SORT_OPTIONS)[number];

export const CUISINES = [
  { id: "american", label: "American", keyword: "american" },
  { id: "chinese", label: "Chinese", keyword: "chinese" },
  { id: "french", label: "French", keyword: "french" },
  { id: "indian", label: "Indian", keyword: "indian" },
  { id: "italian", label: "Italian", keyword: "italian" },
  { id: "japanese", label: "Japanese", keyword: "japanese" },
  { id: "korean", label: "Korean", keyword: "korean" },
  { id: "mediterranean", label: "Mediterranean", keyword: "mediterranean" },
  { id: "mexican", label: "Mexican", keyword: "mexican" },
  { id: "thai", label: "Thai", keyword: "thai" },
  { id: "vietnamese", label: "Vietnamese", keyword: "vietnamese" },
] as const;

export type CuisineId = (typeof CUISINES)[number]["id"];

export interface SearchFilters {
  radiusMeters: RadiusMeters;
  cuisines: CuisineId[];
  openNow: boolean;
  sortBy: SortBy;
}

export const DEFAULT_FILTERS: SearchFilters = {
  radiusMeters: 3000,
  cuisines: [],
  openNow: true,
  sortBy: "distance",
};

export const CUISINE_IDS = new Set<CuisineId>(CUISINES.map((cuisine) => cuisine.id));

export const CUISINE_KEYWORDS: Record<CuisineId, string> = Object.fromEntries(
  CUISINES.map((cuisine) => [cuisine.id, cuisine.keyword])
) as Record<CuisineId, string>;
