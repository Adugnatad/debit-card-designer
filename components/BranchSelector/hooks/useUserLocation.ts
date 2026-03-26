"use client";

import { useCallback, useState } from "react";

export const useUserLocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("Location permission denied or unavailable.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  return { location, loading, error, refreshLocation };
};

