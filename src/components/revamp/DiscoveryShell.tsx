"use client";

import { useMemo, useState } from "react";

import FilterSheet, { type SheetSnap } from "@/components/revamp/FilterSheet";
import MapCanvas from "@/components/revamp/MapCanvas";
import WinnerOverlay from "@/components/revamp/WinnerOverlay";
import { pickRandomRestaurant } from "@/lib/restaurants/winner";
import { DEFAULT_FILTERS, type CuisineId, type RadiusMeters, type SearchFilters, type SortBy } from "@/types/filters";
import type { Coordinates, RestaurantCard, RestaurantsResponse } from "@/types/restaurant";

type LocationState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
};

export default function DiscoveryShell() {
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");

  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [highlightedRestaurantId, setHighlightedRestaurantId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [winner, setWinner] = useState<RestaurantCard | null>(null);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState("granted");
      },
      () => {
        setLocationState("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 45_000,
      }
    );
  };

  const fetchRestaurants = async () => {
    if (!coordinates) {
      setErrorMessage("Choose a location before searching.");
      return;
    }

    setWinner(null);
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusMeters: filters.radiusMeters,
          cuisines: filters.cuisines,
          openNow: filters.openNow,
          sortBy: filters.sortBy,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const payload = (await response.json()) as RestaurantsResponse;
      const normalized = payload.restaurants ?? [];
      setRestaurants(normalized);

      if (normalized.length > 0) {
        setSelectedRestaurantId(normalized[0].id);
      } else {
        setSelectedRestaurantId(null);
      }
      setHighlightedRestaurantId(null);
    } catch (error) {
      setRestaurants([]);
      setSelectedRestaurantId(null);
      setHighlightedRestaurantId(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch nearby restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const startWinnerSelection = () => {
    if (restaurants.length === 0 || isSelectingWinner) {
      return;
    }

    const pool = [...restaurants];
    setWinner(null);
    setIsSelectingWinner(true);

    const intervalId = window.setInterval(() => {
      const candidate = pickRandomRestaurant(pool);
      if (candidate) {
        setHighlightedRestaurantId(candidate.id);
      }
    }, 85);

    window.setTimeout(() => {
      window.clearInterval(intervalId);

      const finalWinner = pickRandomRestaurant(pool);
      if (finalWinner) {
        setWinner(finalWinner);
        setSelectedRestaurantId(finalWinner.id);
        setHighlightedRestaurantId(finalWinner.id);
      }
      setIsSelectingWinner(false);
    }, 2_900);
  };

  const updateFilters = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleCuisine = (cuisineId: CuisineId) => {
    setFilters((previous) => {
      const exists = previous.cuisines.includes(cuisineId);
      return {
        ...previous,
        cuisines: exists ? previous.cuisines.filter((cuisine) => cuisine !== cuisineId) : [...previous.cuisines, cuisineId],
      };
    });
  };

  const focusRestaurant = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setHighlightedRestaurantId(restaurantId);
    setSheetSnap("half");
  };

  return (
    <div className="app-shell">
      <div className="map-stage">
        <MapCanvas
          apiKey={mapApiKey}
          center={coordinates}
          restaurants={restaurants}
          selectedRestaurantId={highlightedRestaurantId ?? selectedRestaurant?.id ?? null}
          onSelectRestaurant={focusRestaurant}
        />
      </div>

      <FilterSheet
        filters={filters}
        locationState={locationState}
        userCoordinates={coordinates}
        restaurants={restaurants}
        loading={loading}
        errorMessage={errorMessage}
        selectedRestaurantId={selectedRestaurantId}
        highlightedRestaurantId={isSelectingWinner ? highlightedRestaurantId : null}
        snap={sheetSnap}
        onSetSnap={setSheetSnap}
        onRadiusChange={(radius) => updateFilters("radiusMeters", radius as RadiusMeters)}
        onCuisineToggle={toggleCuisine}
        onOpenNowChange={(openNow) => updateFilters("openNow", openNow)}
        onSortChange={(sortBy) => updateFilters("sortBy", sortBy as SortBy)}
        onLocate={requestUserLocation}
        onSearch={fetchRestaurants}
        onPickWinner={startWinnerSelection}
        isSelectingWinner={isSelectingWinner}
        onSelectRestaurant={focusRestaurant}
      />

      <WinnerOverlay winner={winner} onDismiss={() => setWinner(null)} />
    </div>
  );
}
