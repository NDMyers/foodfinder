"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  lastSearchKey: string | null;
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
      payload: { restaurants: RestaurantCard[]; searchKey: string };
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
  lastSearchKey: null,
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
        lastSearchKey: action.payload.searchKey,
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
  geocodeAddress: (address: string) => Promise<void>;
  fetchRestaurants: () => Promise<void>;
  searchAndPickWinner: () => Promise<void>;
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

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim()) return;

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error("Failed to geocode address");
      }

      interface GeocodeResponse {
        latitude: number;
        longitude: number;
      }

      const data = (await response.json()) as GeocodeResponse;
      dispatch({
        type: "SET_COORDINATES",
        payload: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to geocode address",
      });
    }
  }, []);

  const generateSearchKey = useCallback((coordinates: Coordinates, filters: SearchFilters): string => {
    return `${coordinates.latitude},${coordinates.longitude},${filters.radiusMeters},${filters.cuisines.join("|")},${filters.openNow},${filters.sortBy}`;
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
      const searchKey = generateSearchKey(state.coordinates, state.filters);
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
        payload: { restaurants: payload.restaurants ?? [], searchKey },
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
  }, [state.coordinates, state.filters, generateSearchKey]);

  const searchAndPickWinner = useCallback(async () => {
    if (!state.coordinates || state.isSelectingWinner || state.loading) return;

    const searchKey = generateSearchKey(state.coordinates, state.filters);
    const isCached = state.lastSearchKey === searchKey && state.restaurants.length > 0;

    if (isCached) {
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
    } else {
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
        const restaurants = payload.restaurants ?? [];

        dispatch({
          type: "FETCH_SUCCESS",
          payload: { restaurants, searchKey },
        });

        if (restaurants.length > 0) {
          const pool = [...restaurants];
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
        }
      } catch (error) {
        dispatch({
          type: "FETCH_ERROR",
          payload:
            error instanceof Error
              ? error.message
              : "Failed to fetch nearby restaurants.",
        });
      }
    }
  }, [state.coordinates, state.filters, state.isSelectingWinner, state.loading, state.lastSearchKey, state.restaurants, generateSearchKey]);

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

  // Auto-fetch restaurants when coordinates change
  const lastFetchedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!state.coordinates || state.loading) return;

    const key = `${state.coordinates.latitude},${state.coordinates.longitude}`;
    if (lastFetchedKeyRef.current === key) return;
    lastFetchedKeyRef.current = key;

    dispatch({ type: "FETCH_START" });
    const coords = state.coordinates;
    const filters = state.filters;
    const searchKey = generateSearchKey(coords, filters);

    fetch("/api/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusMeters: filters.radiusMeters,
        cuisines: filters.cuisines,
        openNow: filters.openNow,
        sortBy: filters.sortBy,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        return res.json() as Promise<RestaurantsResponse>;
      })
      .then((payload) => {
        dispatch({
          type: "FETCH_SUCCESS",
          payload: { restaurants: payload.restaurants ?? [], searchKey },
        });
      })
      .catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : "Failed to fetch nearby restaurants.";
        dispatch({
          type: "FETCH_ERROR",
          payload: errMsg,
        });
      });
  // Only re-run when coordinates change, not filters — user must re-Search to apply filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.coordinates]);

  const value = useMemo<SearchContextValue>(
    () => ({
      state,
      requestUserLocation,
      geocodeAddress,
      fetchRestaurants,
      searchAndPickWinner,
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
      geocodeAddress,
      fetchRestaurants,
      searchAndPickWinner,
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
