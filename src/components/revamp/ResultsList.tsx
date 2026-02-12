"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSearch } from "@/contexts/SearchContext";
import type { RestaurantCard } from "@/types/restaurant";

const formatDistance = (distanceMeters: number | null): string => {
  if (typeof distanceMeters !== "number") return "Distance unavailable";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const formatRating = (rating: number | null): string => {
  if (rating === null) return "Unrated";
  return `${rating.toFixed(1)} / 5`;
};

function SkeletonCards() {
  return (
    <div className="overflow-auto grid gap-3 pb-1" aria-live="polite" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border border-ink-faint/30 bg-white rounded-xl p-4"
        >
          <div className="h-3 w-3/4 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.25s_linear_infinite] mb-3" />
          <div className="h-3 w-1/2 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.25s_linear_infinite] mb-3" />
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
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isHighlighted ? 1.02 : 1,
      }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`border bg-white rounded-xl p-4 text-left cursor-pointer transition-colors shadow-card ${
        isSelected
          ? "border-primary ring-1 ring-primary/20"
          : "border-ink-faint/30 hover:border-ink-faint/60"
      } ${isHighlighted ? "animate-[pulse-highlight_220ms_ease]" : ""}`}
    >
      <div className="flex justify-between items-center gap-2">
        <h3 className="m-0 text-sm font-semibold tracking-tight text-ink">
          {restaurant.name}
        </h3>
        <span
          className={`text-xs rounded-full px-2 py-0.5 font-medium ${
            restaurant.openNow === false
              ? "bg-danger-light text-danger"
              : "bg-primary-light text-primary-dark"
          }`}
        >
          {restaurant.openNow === false ? "Closed" : "Open"}
        </span>
      </div>

      <p className="m-0 mt-1 mb-2 text-sm text-ink-soft truncate">
        {restaurant.address}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-ink-soft">
          {formatDistance(restaurant.distanceMeters)}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-ink-soft">
          {formatRating(restaurant.rating)}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-ink-soft">
          {restaurant.userRatingsTotal
            ? `${restaurant.userRatingsTotal} reviews`
            : "Few reviews"}
        </span>
      </div>
    </motion.button>
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
      className="overflow-auto grid gap-3 pb-1 md:max-h-[min(56dvh,42rem)]"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
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
      </AnimatePresence>
    </div>
  );
}

export default memo(ResultsList);
