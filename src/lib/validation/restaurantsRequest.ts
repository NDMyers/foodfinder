import { CUISINE_IDS, RADIUS_OPTIONS, SORT_OPTIONS, type CuisineId, type RadiusMeters, type SortBy } from "@/types/filters";
import type { RestaurantsRequest } from "@/types/restaurant";

const MAX_CUISINES = 6;

const radiusSet = new Set<number>(RADIUS_OPTIONS);
const sortSet = new Set<string>(SORT_OPTIONS);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export class RequestValidationError extends Error {
  public readonly issues: string[];

  constructor(issues: string[]) {
    super("Invalid restaurants request payload.");
    this.name = "RequestValidationError";
    this.issues = issues;
  }
}

const parseCuisines = (value: unknown, issues: string[]): CuisineId[] => {
  if (!Array.isArray(value)) {
    issues.push("`cuisines` must be an array.");
    return [];
  }

  if (value.length > MAX_CUISINES) {
    issues.push(`A maximum of ${MAX_CUISINES} cuisines can be selected.`);
  }

  const normalized: CuisineId[] = [];
  const seen = new Set<string>();

  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      issues.push(`Cuisine at index ${index} must be a string.`);
      return;
    }

    const candidate = entry.toLowerCase();
    if (!CUISINE_IDS.has(candidate as CuisineId)) {
      issues.push(`Unsupported cuisine value: ${entry}.`);
      return;
    }

    if (seen.has(candidate)) {
      return;
    }

    seen.add(candidate);
    normalized.push(candidate as CuisineId);
  });

  return normalized;
};

export const parseRestaurantsRequest = (value: unknown): RestaurantsRequest => {
  if (!value || typeof value !== "object") {
    throw new RequestValidationError(["Request payload must be a JSON object."]);
  }

  const payload = value as Record<string, unknown>;
  const issues: string[] = [];

  const latitude = payload.latitude;
  const longitude = payload.longitude;
  const radiusMeters = payload.radiusMeters;
  const openNow = payload.openNow;
  const sortBy = payload.sortBy;

  if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
    issues.push("`latitude` must be a finite number between -90 and 90.");
  }

  if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
    issues.push("`longitude` must be a finite number between -180 and 180.");
  }

  if (!isFiniteNumber(radiusMeters) || !radiusSet.has(radiusMeters)) {
    issues.push("`radiusMeters` must be one of 1500, 3000, 4500, or 6000.");
  }

  if (typeof openNow !== "boolean") {
    issues.push("`openNow` must be a boolean.");
  }

  if (typeof sortBy !== "string" || !sortSet.has(sortBy)) {
    issues.push("`sortBy` must be either \"distance\" or \"rating\".");
  }

  const cuisines = parseCuisines(payload.cuisines, issues);

  if (issues.length > 0) {
    throw new RequestValidationError(issues);
  }

  return {
    latitude: latitude as number,
    longitude: longitude as number,
    radiusMeters: radiusMeters as RadiusMeters,
    cuisines,
    openNow: openNow as boolean,
    sortBy: sortBy as SortBy,
  };
};
