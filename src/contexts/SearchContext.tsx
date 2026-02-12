"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { pickRandomRestaurant } from "@/lib/restaurants/winner";
import {
  WINNER_CYCLE_INTERVAL_MS,
  WINNER_SELECTION_DURATION_MS,
} from "@/lib/constants";
import {
  DEFAULT_FILTERS,
  type CuisineId,
  type RadiusMeters,
  type SearchFilters,
  type SortBy,
} from "@/types/filters";
import type {
  Coordinates,
  RestaurantCard,
  RestaurantsResponse,
} from "@/types/restaurant";

export type LocationState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

export type SheetSnap = "peek" | "half" | "full";

interface SearchState {
  locationState: LocationState;
  coordinates: Coordinates | null;
  filters: SearchFilters;
  sheetSnap: SheetSnap;
  restaurants: RestaurantCard[];
  selectedRestaurantId: string | null;
  highlightedRestaurantId: string | null;
  loading: boolean;
  errorMessage: string | null;
  isSelectingWinner: boolean;
  winner: RestaurantCard | null;
}

type SearchAction =
  | { type: "SET_LOCATION_STATE"; payload: LocationState }
  | { type: "SET_COORDINATES"; payload: Coordinates }
  | { type: "SET_SHEET_SNAP"; payload: SheetSnap }
  | { type: "SET_FILTER"; payload: Partial<SearchFilters> }
  | { type: "TOGGLE_CUISINE"; payload: CuisineId }
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: { restaurants: RestaurantCard[] };
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SELECT_RESTAURANT"; payload: string }
  | { type: "HIGHLIGHT_RESTAURANT"; payload: string | null }
  | { type: "WINNER_SELECTION_START" }
  | { type: "WINNER_SELECTED"; payload: RestaurantCard }
  | { type: "WINNER_DISMISSED" };

const initialState: SearchState = {
  locationState: "idle",
  coordinates: null,
  filters: DEFAULT_FILTERS,
  sheetSnap: "half",
  restaurants: [],
  selectedRestaurantId: null,
  highlightedRestaurantId: null,
  loading: false,
  errorMessage: null,
  isSelectingWinner: false,
  winner: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_LOCATION_STATE":
      return { ...state, locationState: action.payload };
    case "SET_COORDINATES":
      return { ...state, coordinates: action.payload, locationState: "granted" };
    case "SET_SHEET_SNAP":
      return { ...state, sheetSnap: action.payload };
    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "TOGGLE_CUISINE": {
      const exists = state.filters.cuisines.includes(action.payload);
      return {
        ...state,
        filters: {
          ...state.filters,
          cuisines: exists
            ? state.filters.cuisines.filter((c) => c !== action.payload)
            : [...state.filters.cuisines, action.payload],
        },
      };
    }
    case "FETCH_START":
      return {
        ...state,
        loading: true,
        errorMessage: null,
        winner: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        restaurants: action.payload.restaurants,
        selectedRestaurantId:
          action.payload.restaurants[0]?.id ?? null,
        highlightedRestaurantId: null,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        loading: false,
        restaurants: [],
        selectedRestaurantId: null,
        highlightedRestaurantId: null,
        errorMessage: action.payload,
      };
    case "SELECT_RESTAURANT":
      return {
        ...state,
        selectedRestaurantId: action.payload,
        highlightedRestaurantId: action.payload,
        sheetSnap: "half",
      };
    case "HIGHLIGHT_RESTAURANT":
      return { ...state, highlightedRestaurantId: action.payload };
    case "WINNER_SELECTION_START":
      return { ...state, isSelectingWinner: true, winner: null };
    case "WINNER_SELECTED":
      return {
        ...state,
        isSelectingWinner: false,
        winner: action.payload,
        selectedRestaurantId: action.payload.id,
        highlightedRestaurantId: action.payload.id,
      };
    case "WINNER_DISMISSED":
      return { ...state, winner: null };
    default:
      return state;
  }
}

interface SearchContextValue {
  state: SearchState;
  requestUserLocation: () => void;
  fetchRestaurants: () => Promise<void>;
  startWinnerSelection: () => void;
  updateRadius: (radius: RadiusMeters) => void;
  updateSort: (sortBy: SortBy) => void;
  updateOpenNow: (openNow: boolean) => void;
  toggleCuisine: (cuisineId: CuisineId) => void;
  focusRestaurant: (restaurantId: string) => void;
  setSheetSnap: (snap: SheetSnap) => void;
  dismissWinner: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    return payload.error?.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      dispatch({ type: "SET_LOCATION_STATE", payload: "unsupported" });
      return;
    }
    dispatch({ type: "SET_LOCATION_STATE", payload: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: "SET_COORDINATES",
          payload: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      () => {
        dispatch({ type: "SET_LOCATION_STATE", payload: "denied" });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 45_000 }
    );
  }, []);

  const fetchRestaurants = useCallback(async () => {
    if (!state.coordinates) {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Choose a location before searching.",
      });
      return;
    }
    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: state.coordinates.latitude,
          longitude: state.coordinates.longitude,
          radiusMeters: state.filters.radiusMeters,
          cuisines: state.filters.cuisines,
          openNow: state.filters.openNow,
          sortBy: state.filters.sortBy,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const payload = (await response.json()) as RestaurantsResponse;
      dispatch({
        type: "FETCH_SUCCESS",
        payload: { restaurants: payload.restaurants ?? [] },
      });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to fetch nearby restaurants.",
      });
    }
  }, [state.coordinates, state.filters]);

  const startWinnerSelection = useCallback(() => {
    if (state.restaurants.length === 0 || state.isSelectingWinner) return;

    const pool = [...state.restaurants];
    dispatch({ type: "WINNER_SELECTION_START" });

    const intervalId = window.setInterval(() => {
      const candidate = pickRandomRestaurant(pool);
      if (candidate) {
        dispatch({ type: "HIGHLIGHT_RESTAURANT", payload: candidate.id });
      }
    }, WINNER_CYCLE_INTERVAL_MS);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      const finalWinner = pickRandomRestaurant(pool);
      if (finalWinner) {
        dispatch({ type: "WINNER_SELECTED", payload: finalWinner });
      }
    }, WINNER_SELECTION_DURATION_MS);
  }, [state.restaurants, state.isSelectingWinner]);

  const updateRadius = useCallback(
    (radius: RadiusMeters) =>
      dispatch({ type: "SET_FILTER", payload: { radiusMeters: radius } }),
    []
  );

  const updateSort = useCallback(
    (sortBy: SortBy) =>
      dispatch({ type: "SET_FILTER", payload: { sortBy } }),
    []
  );

  const updateOpenNow = useCallback(
    (openNow: boolean) =>
      dispatch({ type: "SET_FILTER", payload: { openNow } }),
    []
  );

  const toggleCuisine = useCallback(
    (cuisineId: CuisineId) =>
      dispatch({ type: "TOGGLE_CUISINE", payload: cuisineId }),
    []
  );

  const focusRestaurant = useCallback(
    (restaurantId: string) =>
      dispatch({ type: "SELECT_RESTAURANT", payload: restaurantId }),
    []
  );

  const setSheetSnap = useCallback(
    (snap: SheetSnap) =>
      dispatch({ type: "SET_SHEET_SNAP", payload: snap }),
    []
  );

  const dismissWinner = useCallback(
    () => dispatch({ type: "WINNER_DISMISSED" }),
    []
  );

  const value = useMemo<SearchContextValue>(
    () => ({
      state,
      requestUserLocation,
      fetchRestaurants,
      startWinnerSelection,
      updateRadius,
      updateSort,
      updateOpenNow,
      toggleCuisine,
      focusRestaurant,
      setSheetSnap,
      dismissWinner,
    }),
    [
      state,
      requestUserLocation,
      fetchRestaurants,
      startWinnerSelection,
      updateRadius,
      updateSort,
      updateOpenNow,
      toggleCuisine,
      focusRestaurant,
      setSheetSnap,
      dismissWinner,
    ]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
