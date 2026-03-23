"use client";

import { useLoadScript } from "@react-google-maps/api";
import { createContext, useContext } from "react";

const libraries: ("places")[] = ["places"];

const GoogleMapsContext = createContext<{ isLoaded: boolean }>({
  isLoaded: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
