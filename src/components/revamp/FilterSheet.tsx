"use client";

import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { useCallback, useRef } from "react";

import { useSearch, type SheetSnap } from "@/contexts/SearchContext";
import { CUISINES, RADIUS_OPTIONS, type RadiusMeters, type SortBy } from "@/types/filters";
import Button from "@/components/ui/Button";
import CuisineChip from "@/components/ui/CuisineChip";
import Dropdown from "@/components/ui/Dropdown";
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
        fixed left-0 right-0 bottom-0 z-20 flex flex-col gap-5
        bg-white/70 backdrop-blur-2xl
        border-t border-glass-border
        rounded-t-[2rem]
        px-5 pt-4 shadow-glass
        transition-[max-height] duration-300 ease-out
        md:absolute md:top-6 md:left-6 md:bottom-6 md:w-96 md:rounded-3xl md:border md:!max-h-none md:overflow-y-auto md:bg-white/80
      `}
      data-snap={state.sheetSnap}
    >
      {/* Drag handle — mobile only */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing md:hidden min-h-[48px] -mt-2 -mx-4 items-start"
      >
        <div className="w-14 h-1.5 rounded-full bg-ink/20 hover:bg-ink/30 transition-colors" />
      </motion.div>

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-ink to-ink-soft m-0 leading-none">
            FoodFinder
          </h1>
          <p className="text-sm text-ink-soft font-medium mt-1">
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
              className={`border-0 px-3 py-1.5 text-xs font-medium capitalize transition-colors ${state.sheetSnap === snap
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
        className={`text-sm -mt-1 ${isDenied ? "text-danger" : "text-ink-soft"
          }`}
      >
        {locationCopy[state.locationState]}
      </p>

      {/* Filter controls */}
      <div className="grid grid-cols-2 gap-3 z-30">
        <Dropdown
          label="Search Radius"
          value={state.filters.radiusMeters}
          options={RADIUS_OPTIONS.map((r) => ({ label: `${r / 1000} km`, value: r }))}
          onChange={(val) => updateRadius(val as RadiusMeters)}
        />

        <Dropdown
          label="Sort Results"
          value={state.filters.sortBy}
          options={[
            { label: "Distance", value: "distance" },
            { label: "Rating", value: "rating" },
          ]}
          onChange={(val) => updateSort(val as SortBy)}
        />

        <label className="col-span-2 flex items-center gap-3 mt-1 p-3 rounded-xl bg-white/40 border border-glass-border/40 hover:bg-white/60 transition-colors cursor-pointer text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={state.filters.openNow}
            onChange={(e) => updateOpenNow(e.target.checked)}
            className="w-4 h-4 accent-primary rounded border-glass-border"
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
