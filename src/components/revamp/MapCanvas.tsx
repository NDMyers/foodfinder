"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

import type { Coordinates, RestaurantCard } from "@/types/restaurant";

interface MapCanvasProps {
  apiKey: string | undefined;
  center: Coordinates | null;
  restaurants: RestaurantCard[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (restaurantId: string) => void;
}

const defaultMapCenter: google.maps.LatLngLiteral = {
  lat: 39.5,
  lng: -98.35,
};

function makePinElement(selected: boolean): google.maps.marker.PinElement {
  return new google.maps.marker.PinElement({
    background: selected ? "#d97706" : "#0d9488",
    borderColor: "#ffffff",
    glyphColor: "#ffffff",
    scale: selected ? 1.2 : 1,
  });
}

function MapCanvas({ apiKey, center, restaurants, selectedRestaurantId, onSelectRestaurant }: MapCanvasProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const safeCenter = useMemo<google.maps.LatLngLiteral>(() => {
    if (!center) return defaultMapCenter;
    return { lat: center.latitude, lng: center.longitude };
  }, [center]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current || mapRef.current) return;

    let ignore = false;
    const loader = new Loader({ apiKey, version: "weekly" });

    Promise.all([
      loader.importLibrary("maps"),
      loader.importLibrary("marker"),
    ])
      .then(([{ Map }]) => {
        if (ignore || !mapNodeRef.current) return;
        mapRef.current = new Map(mapNodeRef.current, {
          center: safeCenter,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID",
        });
        setMapReady(true);
      })
      .catch(() => setMapReady(false));

    return () => {
      ignore = true;
    };
  }, [apiKey, safeCenter]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo(safeCenter);
    if (center) mapRef.current.setZoom(14);
  }, [center, safeCenter]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || typeof google === "undefined") return;

    clearMarkers();

    if (restaurants.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    restaurants.forEach((restaurant) => {
      const position = {
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude,
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position,
        title: restaurant.name,
        content: makePinElement(false).element,
      });

      marker.addListener("click", () => onSelectRestaurant(restaurant.id));
      markersRef.current.set(restaurant.id, marker);
      bounds.extend(position);
    });

    const isMobile = window.innerWidth < 768;
    mapRef.current.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: isMobile ? 380 : 60,
      left: isMobile ? 60 : 440,
    });
  }, [clearMarkers, mapReady, onSelectRestaurant, restaurants]);

  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantId || typeof google === "undefined") return;

    markersRef.current.forEach((marker, restaurantId) => {
      marker.content = makePinElement(restaurantId === selectedRestaurantId).element;
    });

    const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
    if (selectedRestaurant) {
      mapRef.current.panTo({
        lat: selectedRestaurant.location.latitude,
        lng: selectedRestaurant.location.longitude,
      });
    }
  }, [restaurants, selectedRestaurantId]);

  useEffect(() => {
    return () => clearMarkers();
  }, [clearMarkers]);

  if (!apiKey) {
    return (
      <div className="min-h-[100dvh] grid place-items-center text-center p-8 bg-background">
        <div>
          <h2 className="m-0 mb-2 text-xl font-bold tracking-tight text-ink">
            Map unavailable
          </h2>
          <p className="m-0 text-sm text-ink-soft">
            Set <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code> to enable map rendering.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[100dvh]"
      ref={mapNodeRef}
      role="application"
      aria-label="Restaurant map"
    />
  );
}

export default memo(MapCanvas);
