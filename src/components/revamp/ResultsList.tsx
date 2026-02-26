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
    <div className="grid gap-0 border-t-2 border-b-2 border-ink pt-0 pb-0" aria-live="polite" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border-b-2 border-ink bg-white p-5 last:border-b-0"
        >
          <div className="h-4 w-3/4 bg-ink/20 animate-pulse mb-3" />
          <div className="h-3 w-1/2 bg-ink/20 animate-pulse mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="w-16 h-6 bg-ink/20 animate-pulse"
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
        animationDelay: `${index * 20}ms`,
        animationFillMode: "both",
      }}
      className={`border-b-2 border-ink p-5 text-left cursor-pointer animate-fade-in transition-colors duration-150 last:border-b-0 ${isSelected
        ? "bg-ink/10"
        : "bg-white text-ink hover:bg-ink/10"
        } ${isHighlighted ? "bg-accent/10 border-accent" : ""}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className={`m-0 text-2xl font-black tracking-tighter uppercase leading-none text-ink`}>
          {restaurant.name}
        </h3>
        <span
          className={`text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-widest border-2 ${restaurant.openNow === false
            ? "border-accent bg-accent text-white"
            : "border-success bg-success text-white"
            }`}
        >
          {restaurant.openNow === false ? "Closed" : "Open"}
        </span>
      </div>

      <p className={`m-0 mt-3 mb-4 text-sm uppercase tracking-tight truncate font-bold text-ink-soft`}>
        {restaurant.address}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-tighter border-ink/20 text-ink`}>
          {formatDistance(restaurant.distanceMeters)}
        </span>
        <span className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-tighter border-ink/20 text-ink`}>
          {formatRating(restaurant.rating)}
        </span>
        <span className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-tighter border-ink/20 text-ink`}>
          {restaurant.userRatingsTotal
            ? `${restaurant.userRatingsTotal} rev`
            : "No rev"}
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
        className="border-2 border-ink bg-white p-6"
        role="status"
      >
        <h3 className="m-0 mb-2 text-xl font-black uppercase tracking-tighter text-ink">
          Couldn&apos;t load nearby restaurants.
        </h3>
        <p className="m-0 text-sm font-bold text-ink-soft">{errorMessage}</p>
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <div
        className="border-2 border-ink bg-white p-6"
        role="status"
      >
        <h3 className="m-0 mb-2 text-xl font-black uppercase tracking-tighter text-ink">
          No matches yet.
        </h3>
        <p className="m-0 text-sm font-bold text-ink-soft">
          Try widening radius, toggling open-now, or clearing cuisine filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col border-t-2 border-b-2 border-ink"
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
