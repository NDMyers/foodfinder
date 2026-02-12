"use client";

import { CUISINES, RADIUS_OPTIONS, type CuisineId, type RadiusMeters, type SearchFilters, type SortBy } from "@/types/filters";
import type { Coordinates, RestaurantCard } from "@/types/restaurant";
import ResultsList from "@/components/revamp/ResultsList";

export type SheetSnap = "peek" | "half" | "full";

interface FilterSheetProps {
  filters: SearchFilters;
  locationState: "idle" | "requesting" | "granted" | "denied" | "unsupported";
  userCoordinates: Coordinates | null;
  restaurants: RestaurantCard[];
  loading: boolean;
  errorMessage: string | null;
  selectedRestaurantId: string | null;
  highlightedRestaurantId: string | null;
  snap: SheetSnap;
  onSetSnap: (snap: SheetSnap) => void;
  onRadiusChange: (radius: RadiusMeters) => void;
  onCuisineToggle: (cuisine: CuisineId) => void;
  onOpenNowChange: (openNow: boolean) => void;
  onSortChange: (sortBy: SortBy) => void;
  onLocate: () => void;
  onSearch: () => void;
  onPickWinner: () => void;
  isSelectingWinner: boolean;
  onSelectRestaurant: (restaurantId: string) => void;
}

const locationCopy: Record<FilterSheetProps["locationState"], string> = {
  idle: "Location not requested yet.",
  requesting: "Requesting your location...",
  granted: "Location ready.",
  denied: "Location blocked. Enable permissions in browser settings.",
  unsupported: "Geolocation is not supported in this browser.",
};

export default function FilterSheet({
  filters,
  locationState,
  userCoordinates,
  restaurants,
  loading,
  errorMessage,
  selectedRestaurantId,
  highlightedRestaurantId,
  snap,
  onSetSnap,
  onRadiusChange,
  onCuisineToggle,
  onOpenNowChange,
  onSortChange,
  onLocate,
  onSearch,
  onPickWinner,
  isSelectingWinner,
  onSelectRestaurant,
}: FilterSheetProps) {
  return (
    <section className="filter-sheet" data-snap={snap} aria-label="Search and results panel">
      <div className="sheet-grabber" />

      <div className="sheet-header-row">
        <div>
          <h1>FoodFinder</h1>
          <p>Nearby restaurants tuned for now.</p>
        </div>

        <div className="sheet-snap-toggle" role="tablist" aria-label="Panel height">
          <button type="button" role="tab" aria-selected={snap === "peek"} onClick={() => onSetSnap("peek")}>
            Peek
          </button>
          <button type="button" role="tab" aria-selected={snap === "half"} onClick={() => onSetSnap("half")}>
            Half
          </button>
          <button type="button" role="tab" aria-selected={snap === "full"} onClick={() => onSetSnap("full")}>
            Full
          </button>
        </div>
      </div>

      <div className="sheet-actions">
        <button type="button" className="tone-primary" onClick={onLocate} disabled={locationState === "requesting"}>
          {locationState === "requesting" ? "Locating..." : "Use Current Location"}
        </button>
        <button type="button" className="tone-secondary" onClick={onSearch} disabled={!userCoordinates || loading}>
          {loading ? "Loading..." : "Find Restaurants"}
        </button>
        <button
          type="button"
          className="tone-emphasis"
          onClick={onPickWinner}
          disabled={!restaurants.length || loading || isSelectingWinner}
        >
          {isSelectingWinner ? "Picking..." : "Random Pick"}
        </button>
      </div>

      <p className={`location-status is-${locationState}`}>{locationCopy[locationState]}</p>

      <div className="sheet-controls">
        <label className="field-stack">
          <span>Search Radius</span>
          <select
            value={filters.radiusMeters}
            onChange={(event) => onRadiusChange(Number(event.target.value) as RadiusMeters)}
          >
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>
                {radius / 1000} km
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack">
          <span>Sort Results</span>
          <select value={filters.sortBy} onChange={(event) => onSortChange(event.target.value as SortBy)}>
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
          </select>
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={(event) => onOpenNowChange(event.target.checked)}
          />
          <span>Only show places currently open</span>
        </label>
      </div>

      <fieldset className="cuisine-grid">
        <legend>Cuisines</legend>
        {CUISINES.map((cuisine) => (
          <label key={cuisine.id} className={`cuisine-chip ${filters.cuisines.includes(cuisine.id) ? "is-active" : ""}`}>
            <input
              type="checkbox"
              checked={filters.cuisines.includes(cuisine.id)}
              onChange={() => onCuisineToggle(cuisine.id)}
            />
            <span>{cuisine.label}</span>
          </label>
        ))}
      </fieldset>

      <ResultsList
        restaurants={restaurants}
        loading={loading}
        errorMessage={errorMessage}
        selectedRestaurantId={selectedRestaurantId}
        highlightedRestaurantId={highlightedRestaurantId}
        onSelectRestaurant={onSelectRestaurant}
      />
    </section>
  );
}
