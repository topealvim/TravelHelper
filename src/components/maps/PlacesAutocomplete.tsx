"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface PlaceResult {
  name: string;
  placeId: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a place...",
}: PlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!autocompleteService.current || input.length < 2) {
        setPredictions([]);
        return;
      }
      autocompleteService.current.getPlacePredictions(
        { input },
        (results) => {
          setPredictions(results || []);
          setShowDropdown(true);
        }
      );
    },
    []
  );

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["name", "geometry", "formatted_address"] },
      (place) => {
        if (place?.geometry?.location) {
          const result: PlaceResult = {
            name: place.name || prediction.structured_formatting.main_text,
            placeId: prediction.place_id,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            address: place.formatted_address || prediction.description,
          };
          onChange(result.name);
          onPlaceSelect(result);
          setShowDropdown(false);
          setPredictions([]);
        }
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchPredictions(val);
  };

  if (!isLoaded) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-xs text-muted-foreground">
                {prediction.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
