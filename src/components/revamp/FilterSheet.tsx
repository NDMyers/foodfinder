"use client";

import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { useCallback, useRef } from "react";

import { useSearch, type SheetSnap } from "@/contexts/SearchContext";
import { CUISINES, RADIUS_OPTIONS, type RadiusMeters, type SortBy } from "@/types/filters";
import Button from "@/components/ui/Button";
import CuisineChip from "@/components/ui/CuisineChip";
import ResultsList from "@/components/revamp/ResultsList";

const locationCopy: Record<string, string> = {
  idle: "Location not requested yet.",
  requesting: "Requesting your location...",
  granted: "Location ready.",
  denied: "Location blocked. Enable permissions in browser settings.",
  unsupported: "Geolocation is not supported in this browser.",
};

const snapHeights: Record<SheetSnap, number> = {
  peek: 34,
  half: 62,
  full: 90,
};

export default function FilterSheet() {
  const {
    state,
    requestUserLocation,
    fetchRestaurants,
    startWinnerSelection,
    updateRadius,
    updateSort,
    updateOpenNow,
    toggleCuisine,
    setSheetSnap,
  } = useSearch();

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const sheetOpacity = useTransform(dragY, [-100, 0, 200], [1, 1, 0.8]);

  const snapToPosition = useCallback(
    (snap: SheetSnap) => {
      setSheetSnap(snap);
      animate(dragY, 0, { type: "spring", stiffness: 300, damping: 30 });
    },
    [dragY, setSheetSnap]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      if (velocity > 300 || offset > 80) {
        if (state.sheetSnap === "full") snapToPosition("half");
        else if (state.sheetSnap === "half") snapToPosition("peek");
        else snapToPosition("peek");
      } else if (velocity < -300 || offset < -80) {
        if (state.sheetSnap === "peek") snapToPosition("half");
        else if (state.sheetSnap === "half") snapToPosition("full");
        else snapToPosition("full");
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    },
    [state.sheetSnap, snapToPosition, dragY]
  );

  const isDenied = state.locationState === "denied" || state.locationState === "unsupported";

  return (
    <motion.section
      ref={sheetRef}
      aria-label="Search and results panel"
      style={{
        opacity: sheetOpacity,
        y: dragY,
        maxHeight: `${snapHeights[state.sheetSnap]}dvh`,
        paddingBottom: `calc(1.25rem + env(safe-area-inset-bottom))`,
      }}
      className={`
        fixed left-0 right-0 bottom-0 z-20 flex flex-col gap-4
        bg-white/95 backdrop-blur-md
        border-t border-ink-faint/30
        rounded-t-2xl
        px-4 pt-3 shadow-elevated
        transition-[max-height] duration-200 ease-out
        md:relative md:!max-h-none md:rounded-none md:border-t-0 md:border-l md:border-ink-faint/30 md:px-5 md:pt-5 md:backdrop-blur-none md:overflow-y-auto
      `}
      data-snap={state.sheetSnap}
    >
      {/* Drag handle — mobile only */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="flex justify-center py-2 cursor-grab active:cursor-grabbing md:hidden min-h-[48px] -mt-1"
      >
        <div className="w-12 h-1 rounded-full bg-ink-faint/50" />
      </motion.div>

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-ink m-0">
            FoodFinder
          </h1>
          <p className="text-sm text-ink-soft mt-0.5">
            Nearby restaurants tuned for now.
          </p>
        </div>

        <div
          className="inline-flex border border-ink-faint/40 rounded-full overflow-hidden bg-white/80"
          role="tablist"
          aria-label="Panel height"
        >
          {(["peek", "half", "full"] as const).map((snap) => (
            <button
              key={snap}
              type="button"
              role="tab"
              aria-selected={state.sheetSnap === snap}
              onClick={() => snapToPosition(snap)}
              className={`border-0 px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                state.sheetSnap === snap
                  ? "bg-primary text-white"
                  : "bg-transparent text-ink-soft hover:bg-gray-100"
              }`}
            >
              {snap}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="primary"
          onClick={requestUserLocation}
          disabled={state.locationState === "requesting"}
          className="text-xs"
        >
          {state.locationState === "requesting" ? "Locating..." : "Use Location"}
        </Button>
        <Button
          variant="secondary"
          onClick={fetchRestaurants}
          disabled={!state.coordinates || state.loading}
          className="text-xs"
        >
          {state.loading ? "Loading..." : "Find Food"}
        </Button>
        <Button
          variant="emphasis"
          onClick={startWinnerSelection}
          disabled={
            !state.restaurants.length ||
            state.loading ||
            state.isSelectingWinner
          }
          className="text-xs"
        >
          {state.isSelectingWinner ? "Picking..." : "Random Pick"}
        </Button>
      </div>

      {/* Location status */}
      <p
        className={`text-sm -mt-1 ${
          isDenied ? "text-danger" : "text-ink-soft"
        }`}
      >
        {locationCopy[state.locationState]}
      </p>

      {/* Filter controls */}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-ink-soft tracking-wide">
            Search Radius
          </span>
          <select
            value={state.filters.radiusMeters}
            onChange={(e) =>
              updateRadius(Number(e.target.value) as RadiusMeters)
            }
            className="border border-ink-faint/40 rounded-xl bg-white px-3 py-2.5 text-sm min-h-[44px]"
          >
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>
                {radius / 1000} km
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-ink-soft tracking-wide">
            Sort Results
          </span>
          <select
            value={state.filters.sortBy}
            onChange={(e) => updateSort(e.target.value as SortBy)}
            className="border border-ink-faint/40 rounded-xl bg-white px-3 py-2.5 text-sm min-h-[44px]"
          >
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
          </select>
        </label>

        <label className="col-span-2 flex items-center gap-2 text-sm min-h-[44px]">
          <input
            type="checkbox"
            checked={state.filters.openNow}
            onChange={(e) => updateOpenNow(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span>Only show places currently open</span>
        </label>
      </div>

      {/* Cuisines */}
      <fieldset className="m-0 p-0 border-0 flex flex-wrap gap-2">
        <legend className="w-full mb-1 text-xs text-ink-soft tracking-wide">
          Cuisines
        </legend>
        {CUISINES.map((cuisine) => (
          <CuisineChip
            key={cuisine.id}
            label={cuisine.label}
            active={state.filters.cuisines.includes(cuisine.id)}
            onToggle={() => toggleCuisine(cuisine.id)}
          />
        ))}
      </fieldset>

      {/* Results */}
      <ResultsList />
    </motion.section>
  );
}
