"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { elementType: "geometry", stylers: [{ color: "#f4f1e8" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#433f35" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f4f1e8" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8dfcb" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ded4bc" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#accfe0" }] },
];

export default function MapCanvas({ apiKey, center, restaurants, selectedRestaurantId, onSelectRestaurant }: MapCanvasProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [mapReady, setMapReady] = useState(false);

  const safeCenter = useMemo<google.maps.LatLngLiteral>(() => {
    if (!center) {
      return defaultMapCenter;
    }

    return { lat: center.latitude, lng: center.longitude };
  }, [center]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current || mapRef.current) {
      return;
    }

    let ignore = false;
    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    loader
      .load()
      .then(() => {
        if (ignore || !mapNodeRef.current) {
          return;
        }

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
      .catch(() => {
        setMapReady(false);
      });

    return () => {
      ignore = true;
    };
  }, [apiKey, safeCenter]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.panTo(safeCenter);
    if (center) {
      mapRef.current.setZoom(14);
    }
  }, [center, safeCenter]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || typeof google === "undefined") {
      return;
    }

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
          fillColor: "#4f6b4a",
          fillOpacity: 1,
          strokeColor: "#f4f1e8",
          strokeWeight: 2,
          scale: 7,
        },
      });

      marker.addListener("click", () => onSelectRestaurant(restaurant.id));
      markersRef.current.set(restaurant.id, marker);
    });
  }, [clearMarkers, mapReady, onSelectRestaurant, restaurants]);

  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantId || typeof google === "undefined") {
      return;
    }

    markersRef.current.forEach((marker, restaurantId) => {
      const isSelected = restaurantId === selectedRestaurantId;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isSelected ? "#ad7f2d" : "#4f6b4a",
        fillOpacity: 1,
        strokeColor: "#f4f1e8",
        strokeWeight: 2,
        scale: isSelected ? 9 : 7,
      });
    });

    const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId);
    if (selectedRestaurant) {
      mapRef.current.panTo({
        lat: selectedRestaurant.location.latitude,
        lng: selectedRestaurant.location.longitude,
      });
    }
  }, [restaurants, selectedRestaurantId]);

  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  if (!apiKey) {
    return (
      <div className="map-empty-state">
        <h2>Map unavailable</h2>
        <p>Set `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` to enable map rendering.</p>
      </div>
    );
  }

  return <div className="map-canvas" ref={mapNodeRef} role="application" aria-label="Restaurant map" />;
}
