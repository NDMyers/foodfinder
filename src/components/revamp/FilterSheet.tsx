"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { useSearch, type SheetSnap } from "@/contexts/SearchContext";
import { CUISINES, METERS_TO_MILES, RADIUS_OPTIONS, type RadiusMeters } from "@/types/filters";
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
        animate(dragY, 0, { type: "tween", duration: 0.2 });
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
        bg-white border-t-4 border-ink
        rounded-t-none
        transition-[max-height] duration-200 ease-out
        md:absolute md:top-6 md:left-6 md:bottom-6 md:w-1/3 md:rounded-none md:border-r-4 md:border-b-4 md:border-l-4 md:!max-h-[calc(100dvh-3rem)] md:bg-white md:!transform-none md:overflow-y-auto
      `}
      data-snap={state.sheetSnap}
    >
      {/* Drag handle — mobile only. */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => dragY.set(info.offset.y * 0.4)}
        onDragEnd={handleDragEnd}
        className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing md:hidden shrink-0 touch-none"
      >
        <div className="w-16 h-2 bg-ink" />
      </motion.div>

      {/* Scrollable content area — overflow here, NOT on the outer section,
          so drag events are not swallowed by the scroll container on mobile. */}
      <div className="flex flex-col gap-5 overflow-y-auto px-5 pt-3 pb-4 md:px-5 md:pt-5">

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase text-ink m-0 leading-none">
              Food<br />Finder
            </h1>
            <Button
              variant="secondary"
              onClick={requestUserLocation}
              disabled={state.locationState === "requesting"}
              className="text-xs !bg-ink !text-white !border-ink w-fit mt-2"
            >
              {state.locationState === "requesting" ? "Locating..." : "Use Location"}
            </Button>
          </div>

          {/* Address Input with Autocomplete */}
          <div className="relative">
            <input
              type="text"
              placeholder="ENTER AN ADDRESS..."
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
              className="w-full px-4 py-3 text-sm font-bold uppercase tracking-tighter bg-white border-2 border-ink rounded-none placeholder-ink/40 text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 transition-all"
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-ink rounded-none shadow-elevated z-50 overflow-hidden">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`${suggestion.placeId}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-sm text-left text-ink border-b-2 border-ink last:border-0 font-bold uppercase tracking-tighter"
                  >
                    <div>{suggestion.description}</div>
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
            className="w-full text-lg shadow-card mt-1"
          >
            {state.loading ? "Searching..." : state.isSelectingWinner ? "Picking..." : "Search Region"}
          </Button>
        </div>

        {/* Location status — only show errors */}
        {isDenied && (
          <p className="text-sm -mt-1 text-danger">
            {locationCopy[state.locationState]}
          </p>
        )}

        {/* Filter controls */}
        <div className="flex flex-col gap-3 z-30">
          <Dropdown
            label="Search Radius"
            value={state.filters.radiusMeters}
            options={RADIUS_OPTIONS.map((r) => {
              const mi = Math.round(r * METERS_TO_MILES);
              return { label: `${mi} ${mi === 1 ? "mile" : "miles"}`, value: r };
            })}
            onChange={(val) => updateRadius(val as RadiusMeters)}
          />

          <label className="flex items-center gap-3 mt-1 p-3 bg-white cursor-pointer text-sm font-bold uppercase tracking-tighter text-ink">
            <input
              type="checkbox"
              checked={state.filters.openNow}
              onChange={(e) => updateOpenNow(e.target.checked)}
              className="w-5 h-5 accent-ink border-2 border-ink bg-white rounded-none"
            />
            <span>Only show places currently open</span>
          </label>
        </div>

        {/* Cuisines — expandable */}
        <div className="bg-white mt-1">
          <button
            type="button"
            onClick={() => setCuisinesOpen((o) => !o)}
            className={`w-full flex items-center justify-between px-4 py-3 bg-white text-sm font-bold uppercase tracking-tighter text-ink ${cuisinesOpen ? "border-b-2 border-ink" : ""}`}
          >
            <span className="flex items-center gap-2">
              Cuisines
              {state.filters.cuisines.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 bg-accent text-white border-2 border-accent">
                  {state.filters.cuisines.length}
                </span>
              )}
            </span>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              animate={{ rotate: cuisinesOpen ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5"
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
            transition={{ duration: 0.15, ease: "linear" }}
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
