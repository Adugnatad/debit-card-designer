import type { Branch } from "../types";

export const calculateDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const sortBranchesByDistance = (
  branches: Branch[],
  userLocation?: { lat: number; lng: number } | null
) => {
  if (!userLocation) return branches;
  return [...branches]
    .map((b) => ({
      ...b,
      distance: calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
};

