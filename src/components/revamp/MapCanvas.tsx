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

const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fafafa" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#d1d5db" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfdbfe" }] },
];

function MapCanvas({ apiKey, center, restaurants, selectedRestaurantId, onSelectRestaurant }: MapCanvasProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const safeCenter = useMemo<google.maps.LatLngLiteral>(() => {
    if (!center) return defaultMapCenter;
    return { lat: center.latitude, lng: center.longitude };
  }, [center]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current || mapRef.current) return;

    let ignore = false;
    const loader = new Loader({ apiKey, version: "weekly" });

    loader
      .load()
      .then(() => {
        if (ignore || !mapNodeRef.current) return;
        mapRef.current = new google.maps.Map(mapNodeRef.current, {
          center: safeCenter,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          styles: mapStyles,
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
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || typeof google === "undefined") return;

    clearMarkers();

    restaurants.forEach((restaurant) => {
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: {
          lat: restaurant.location.latitude,
          lng: restaurant.location.longitude,
        },
        title: restaurant.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#0d9488",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 7,
        },
      });

      marker.addListener("click", () => onSelectRestaurant(restaurant.id));
      markersRef.current.set(restaurant.id, marker);
    });
  }, [clearMarkers, mapReady, onSelectRestaurant, restaurants]);

  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantId || typeof google === "undefined") return;

    markersRef.current.forEach((marker, restaurantId) => {
      const isSelected = restaurantId === selectedRestaurantId;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isSelected ? "#d97706" : "#0d9488",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: isSelected ? 9 : 7,
      });
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
