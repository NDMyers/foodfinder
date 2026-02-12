"use client";

import type { RestaurantCard } from "@/types/restaurant";

interface ResultsListProps {
  restaurants: RestaurantCard[];
  loading: boolean;
  errorMessage: string | null;
  selectedRestaurantId: string | null;
  highlightedRestaurantId: string | null;
  onSelectRestaurant: (restaurantId: string) => void;
}

const formatDistance = (distanceMeters: number | null): string => {
  if (typeof distanceMeters !== "number") {
    return "Distance unavailable";
  }

  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const formatRating = (rating: number | null): string => {
  if (rating === null) {
    return "Unrated";
  }

  return `${rating.toFixed(1)} / 5`;
};

export default function ResultsList({
  restaurants,
  loading,
  errorMessage,
  selectedRestaurantId,
  highlightedRestaurantId,
  onSelectRestaurant,
}: ResultsListProps) {
  if (loading) {
    return (
      <div className="results-stack" aria-live="polite" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="result-card skeleton-card">
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
            <div className="skeleton-row">
              <div className="skeleton-chip" />
              <div className="skeleton-chip" />
              <div className="skeleton-chip" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="empty-state" role="status">
        <h3>Couldn&apos;t load nearby restaurants.</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <div className="empty-state" role="status">
        <h3>No matches yet.</h3>
        <p>Try widening radius, toggling open-now, or clearing cuisine filters.</p>
      </div>
    );
  }

  return (
    <div className="results-stack" aria-live="polite">
      {restaurants.map((restaurant) => {
        const isSelected = selectedRestaurantId === restaurant.id;
        const isHighlighted = highlightedRestaurantId === restaurant.id;

        return (
          <button
            key={restaurant.id}
            type="button"
            className={`result-card ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
            onClick={() => onSelectRestaurant(restaurant.id)}
          >
            <div className="result-heading">
              <h3>{restaurant.name}</h3>
              <span className="result-open-chip">{restaurant.openNow === false ? "Closed" : "Open"}</span>
            </div>

            <p>{restaurant.address}</p>

            <div className="result-meta-row">
              <span className="meta-chip">{formatDistance(restaurant.distanceMeters)}</span>
              <span className="meta-chip">{formatRating(restaurant.rating)}</span>
              <span className="meta-chip">{restaurant.userRatingsTotal ? `${restaurant.userRatingsTotal} reviews` : "Few reviews"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
