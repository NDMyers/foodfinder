"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { useSearch, type SheetSnap } from "@/contexts/SearchContext";
import { CUISINES, METERS_TO_MILES, RADIUS_OPTIONS, type RadiusMeters, type SortBy } from "@/types/filters";
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

interface AddressSuggestion {
  description: string;
  placeId: string;
}

export default function FilterSheet() {
  const [cuisinesOpen, setCuisinesOpen] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const {
    state,
    requestUserLocation,
    geocodeAddress,
    searchAndPickWinner,
    updateRadius,
    updateSort,
    updateOpenNow,
    toggleCuisine,
    setSheetSnap,
  } = useSearch();

  const hasAutoExpanded = useRef(false);

  // Auto-expand sheet to full only once when restaurants first load.
  // Intentionally excludes state.sheetSnap from deps — re-running on every
  // sheetSnap change would lock the user out of dragging the sheet down.
  useEffect(() => {
    if (state.restaurants.length > 0 && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true;
      setSheetSnap("full");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.restaurants.length]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const sheetOpacity = useTransform(dragY, [-60, 0, 150], [1, 1, 0.85]);

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
        else snapToPosition("peek");
      } else if (velocity < -300 || offset < -80) {
        if (state.sheetSnap === "peek") snapToPosition("half");
        else snapToPosition("full");
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    },
    [state.sheetSnap, snapToPosition, dragY]
  );

  const isDenied = state.locationState === "denied" || state.locationState === "unsupported";

  const handleAddressChange = useCallback(
    async (value: string) => {
      setAddressInput(value);
      if (value.trim().length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch("/api/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: value }),
        });

        if (!response.ok) throw new Error("Autocomplete failed");

        interface AutocompleteResult {
          predictions: AddressSuggestion[];
        }

        const data = (await response.json()) as AutocompleteResult;
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      } catch (error) {
        setSuggestions([]);
      }
    },
    []
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setAddressInput(suggestion.description);
      setSuggestions([]);
      setShowSuggestions(false);
      geocodeAddress(suggestion.description);
    },
    [geocodeAddress]
  );

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
        fixed left-0 right-0 bottom-0 z-20 flex flex-col
        bg-white/70 backdrop-blur-2xl
        border-t border-glass-border
        rounded-t-[2rem]
        shadow-glass
        transition-[max-height] duration-300 ease-out
        md:absolute md:top-6 md:left-6 md:bottom-6 md:w-96 md:rounded-3xl md:border md:!max-h-[calc(100dvh-3rem)] md:bg-white/80 md:!transform-none md:overflow-y-auto
      `}
      data-snap={state.sheetSnap}
    >
      {/* Drag handle — mobile only. drag="y" on this element feeds dragY which
          applies to the parent section for a rubber-band visual effect. */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.25}
        onDrag={(_, info) => dragY.set(info.offset.y * 0.4)}
        onDragEnd={handleDragEnd}
        className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing md:hidden shrink-0 touch-none"
      >
        <div className="w-14 h-1.5 rounded-full bg-ink/20 hover:bg-ink/30 transition-colors" />
      </motion.div>

      {/* Scrollable content area — overflow here, NOT on the outer section,
          so drag events are not swallowed by the scroll container on mobile. */}
      <div className="flex flex-col gap-5 overflow-y-auto px-5 pt-3 pb-4 md:px-5 md:pt-5">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-ink to-ink-soft m-0 leading-none">
                Food Finder
              </h1>
            </div>
            <Button
              variant="secondary"
              onClick={requestUserLocation}
              disabled={state.locationState === "requesting"}
              className="text-xs !bg-slate-600/80 !border-slate-500/50 !text-slate-100 hover:!bg-slate-600"
            >
              {state.locationState === "requesting" ? "Locating..." : "Use Location"}
            </Button>
          </div>

          {/* Address Input with Autocomplete */}
          <div className="relative">
            <input
              type="text"
              placeholder="Enter an address..."
              value={addressInput}
              onChange={(e) => handleAddressChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && addressInput.trim()) {
                  geocodeAddress(addressInput);
                  setAddressInput("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => addressInput.trim().length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-3 py-2 text-sm bg-white/40 border border-ink/20 rounded-xl placeholder-ink-soft/60 text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur-md border border-glass-border/40 rounded-xl shadow-lg z-50 overflow-hidden">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`${suggestion.placeId}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-sm text-left text-ink hover:bg-primary/10 transition-colors border-b border-glass-border/20 last:border-0"
                  >
                    <div className="font-medium">{suggestion.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Action */}
          <Button
            variant="emphasis"
            onClick={searchAndPickWinner}
            disabled={
              !state.coordinates ||
              state.loading ||
              state.isSelectingWinner
            }
            className="text-sm font-semibold w-full"
          >
            {state.loading ? "Searching..." : state.isSelectingWinner ? "Picking..." : "Search"}
          </Button>
        </div>

        {/* Location status — only show errors */}
        {isDenied && (
          <p className="text-sm -mt-1 text-danger">
            {locationCopy[state.locationState]}
          </p>
        )}

        {/* Filter controls */}
        <div className="grid grid-cols-2 gap-3 z-30">
          <Dropdown
            label="Search Radius"
            value={state.filters.radiusMeters}
            options={RADIUS_OPTIONS.map((r) => {
              const mi = Math.round(r * METERS_TO_MILES);
              return { label: `${mi} ${mi === 1 ? "mile" : "miles"}`, value: r };
            })}
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

        {/* Cuisines — expandable */}
        <div className="border border-glass-border/40 rounded-xl">
          <button
            type="button"
            onClick={() => setCuisinesOpen((o) => !o)}
            className={`w-full flex items-center justify-between px-3 py-2.5 bg-white/40 hover:bg-white/60 transition-colors text-sm font-medium text-ink rounded-t-xl ${cuisinesOpen ? "" : "rounded-b-xl"}`}
          >
            <span className="flex items-center gap-2">
              Cuisines
              {state.filters.cuisines.length > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-accent text-white tabular-nums">
                  {state.filters.cuisines.length}
                </span>
              )}
            </span>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              animate={{ rotate: cuisinesOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-4 h-4 text-ink-soft"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </motion.svg>
          </button>

          <motion.div
            animate={{
              height: cuisinesOpen ? "auto" : 0,
              opacity: cuisinesOpen ? 1 : 0,
            }}
            initial={false}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-wrap gap-2 px-3 py-3">
              {CUISINES.map((cuisine) => (
                <CuisineChip
                  key={cuisine.id}
                  label={cuisine.label}
                  active={state.filters.cuisines.includes(cuisine.id)}
                  onToggle={() => toggleCuisine(cuisine.id)}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Results */}
        <ResultsList />
      </div>
    </motion.section>
  );
}
