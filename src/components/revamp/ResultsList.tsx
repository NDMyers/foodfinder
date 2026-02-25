"use client";

import { memo } from "react";


import { useSearch } from "@/contexts/SearchContext";
import { METERS_TO_MILES } from "@/types/filters";
import type { RestaurantCard } from "@/types/restaurant";

const formatDistance = (distanceMeters: number | null): string => {
  if (typeof distanceMeters !== "number" || distanceMeters < 0)
    return "Distance unavailable";
  const miles = distanceMeters * METERS_TO_MILES;
  if (miles < 0.1) return `${Math.round(distanceMeters)} m`;
  return `${miles.toFixed(1)} miles`;
};

const formatRating = (rating: number | null): string => {
  if (rating === null) return "Unrated";
  return `${rating.toFixed(1)} / 5`;
};

function SkeletonCards() {
  return (
    <div className="grid gap-3 pt-1 pb-2" aria-live="polite" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border border-glass-border/40 bg-white/40 backdrop-blur-md rounded-2xl p-5"
        >
          <div className="h-4 w-3/4 rounded-md bg-gradient-to-r from-gray-200/50 via-gray-100/50 to-gray-200/50 bg-[length:200%_100%] animate-[shimmer_1.25s_linear_infinite] mb-3" />
          <div className="h-3 w-1/2 rounded-md bg-gradient-to-r from-gray-200/50 via-gray-100/50 to-gray-200/50 bg-[length:200%_100%] animate-[shimmer_1.25s_linear_infinite] mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="w-16 h-6 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.25s_linear_infinite]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RestaurantCardItem({
  restaurant,
  isSelected,
  isHighlighted,
  onSelect,
  index,
}: {
  restaurant: RestaurantCard;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "both",
      }}
      className={`border bg-white/60 backdrop-blur-md rounded-2xl p-5 text-left cursor-pointer shadow-sm animate-fade-in hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 ${isSelected
        ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md shadow-primary/10"
        : "border-glass-border/50 hover:border-glass-border hover:bg-white/80 hover:shadow-card"
        } ${isHighlighted ? "scale-[1.02] animate-[pulse-highlight_220ms_ease]" : ""}`}
    >
      <div className="flex justify-between items-center gap-2">
        <h3 className="m-0 text-base font-bold tracking-tight text-ink">
          {restaurant.name}
        </h3>
        <span
          className={`text-xs rounded-full px-2 py-0.5 font-medium ${restaurant.openNow === false
            ? "bg-danger-light text-danger"
            : "bg-success-light text-success-dark"
            }`}
        >
          {restaurant.openNow === false ? "Closed" : "Open"}
        </span>
      </div>

      <p className="m-0 mt-1 mb-3 text-sm text-ink-soft truncate font-medium">
        {restaurant.address}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-black/5 border border-black/5 px-3 py-1 text-xs text-ink-soft font-medium">
          {formatDistance(restaurant.distanceMeters)}
        </span>
        <span className="inline-flex items-center rounded-full bg-black/5 border border-black/5 px-3 py-1 text-xs text-ink-soft font-medium">
          {formatRating(restaurant.rating)}
        </span>
        <span className="inline-flex items-center rounded-full bg-black/5 border border-black/5 px-3 py-1 text-xs text-ink-soft font-medium">
          {restaurant.userRatingsTotal
            ? `${restaurant.userRatingsTotal} reviews`
            : "Few reviews"}
        </span>
      </div>
    </button>
  );
}

function ResultsList() {
  const { state, focusRestaurant } = useSearch();
  const {
    restaurants,
    loading,
    errorMessage,
    selectedRestaurantId,
    highlightedRestaurantId,
    isSelectingWinner,
  } = state;

  if (loading) return <SkeletonCards />;

  if (errorMessage) {
    return (
      <div
        className="border border-dashed border-ink-faint/50 rounded-xl p-6 text-center"
        role="status"
      >
        <h3 className="m-0 mb-2 text-sm font-semibold text-ink">
          Couldn&apos;t load nearby restaurants.
        </h3>
        <p className="m-0 text-sm text-ink-soft">{errorMessage}</p>
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <div
        className="border border-dashed border-ink-faint/50 rounded-xl p-6 text-center"
        role="status"
      >
        <h3 className="m-0 mb-2 text-sm font-semibold text-ink">
          No matches yet.
        </h3>
        <p className="m-0 text-sm text-ink-soft">
          Try widening radius, toggling open-now, or clearing cuisine filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 pt-1 pb-2"
      aria-live="polite"
    >
      {restaurants.map((restaurant, index) => (
        <RestaurantCardItem
          key={restaurant.id}
          restaurant={restaurant}
          isSelected={selectedRestaurantId === restaurant.id}
          isHighlighted={
            isSelectingWinner &&
            highlightedRestaurantId === restaurant.id
          }
          onSelect={() => focusRestaurant(restaurant.id)}
          index={index}
        />
      ))}
    </div>
  );
}

export default memo(ResultsList);
