"use client";

import { useMemo, useCallback } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { useGoogleMaps } from "./GoogleMapsProvider";
import type { Activity } from "@/lib/types";

interface ActivityMapProps {
  activities: Activity[];
  selectedActivityId?: string | null;
  onActivitySelect?: (id: string) => void;
}

const CATEGORY_PIN_COLORS: Record<string, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  activity: "#22c55e",
  accommodation: "#a855f7",
  free: "#6b7280",
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
};

const defaultCenter = { lat: 41.3874, lng: 2.1686 }; // Barcelona default

function createMarkerLabel(index: number, isSelected: boolean): google.maps.MarkerLabel {
  return {
    text: String.fromCharCode(65 + index), // A, B, C...
    color: isSelected ? "#ffffff" : "#ffffff",
    fontSize: "12px",
    fontWeight: "bold",
  };
}

export function ActivityMap({
  activities,
  selectedActivityId,
  onActivitySelect,
}: ActivityMapProps) {
  const { isLoaded } = useGoogleMaps();

  const geoActivities = useMemo(
    () => activities.filter((a) => a.latitude && a.longitude),
    [activities]
  );

  const center = useMemo(() => {
    if (geoActivities.length === 0) return defaultCenter;
    const avgLat =
      geoActivities.reduce((sum, a) => sum + (a.latitude || 0), 0) /
      geoActivities.length;
    const avgLng =
      geoActivities.reduce((sum, a) => sum + (a.longitude || 0), 0) /
      geoActivities.length;
    return { lat: avgLat, lng: avgLng };
  }, [geoActivities]);

  const bounds = useMemo(() => {
    if (!isLoaded || geoActivities.length === 0) return null;
    const b = new google.maps.LatLngBounds();
    geoActivities.forEach((a) => {
      b.extend({ lat: a.latitude!, lng: a.longitude! });
    });
    return b;
  }, [isLoaded, geoActivities]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (bounds && geoActivities.length > 1) {
        map.fitBounds(bounds, 50);
      }
    },
    [bounds, geoActivities.length]
  );

  const pathCoords = useMemo(
    () =>
      geoActivities.map((a) => ({
        lat: a.latitude!,
        lng: a.longitude!,
      })),
    [geoActivities]
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-full min-h-[400px]">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (geoActivities.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-full min-h-[400px]">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            No locations to show on map
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add locations to activities to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={onMapLoad}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {geoActivities.map((activity, index) => {
        const isSelected = activity.id === selectedActivityId;
        const color = CATEGORY_PIN_COLORS[activity.category || "free"];
        return (
          <MarkerF
            key={activity.id}
            position={{ lat: activity.latitude!, lng: activity.longitude! }}
            label={createMarkerLabel(index, isSelected)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 16 : 12,
              fillColor: isSelected ? "#1d4ed8" : color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            onClick={() => onActivitySelect?.(activity.id)}
            zIndex={isSelected ? 10 : 1}
          />
        );
      })}

      {pathCoords.length > 1 && (
        <PolylineF
          path={pathCoords}
          options={{
            strokeColor: "#6366f1",
            strokeOpacity: 0.6,
            strokeWeight: 3,
            geodesic: true,
          }}
        />
      )}
    </GoogleMap>
  );
}
