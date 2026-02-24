"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { SearchProvider, useSearch } from "@/contexts/SearchContext";
import FilterSheet from "@/components/revamp/FilterSheet";
import WinnerOverlay from "@/components/revamp/WinnerOverlay";

const MapCanvas = dynamic(() => import("@/components/revamp/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid place-items-center min-h-[100dvh] bg-background text-ink-soft">
      <p className="text-sm animate-pulse">Loading map...</p>
    </div>
  ),
});

interface DiscoveryShellProps {
  mapApiKey?: string;
}

function ShellLayout({ mapApiKey }: DiscoveryShellProps) {
  const { state, focusRestaurant } = useSearch();

  const handleSelectRestaurant = useCallback(
    (id: string) => focusRestaurant(id),
    [focusRestaurant]
  );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="absolute inset-0">
        <MapCanvas
          apiKey={mapApiKey}
          center={state.coordinates}
          restaurants={state.restaurants}
          selectedRestaurantId={
            state.highlightedRestaurantId ?? state.selectedRestaurantId
          }
          onSelectRestaurant={handleSelectRestaurant}
        />
      </div>

      <FilterSheet />
      <WinnerOverlay />
    </div>
  );
}

export default function DiscoveryShell({ mapApiKey }: DiscoveryShellProps) {
  return (
    <SearchProvider>
      <ShellLayout mapApiKey={mapApiKey} />
    </SearchProvider>
  );
}
