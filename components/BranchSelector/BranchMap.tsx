"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Alert, Box, Button } from "@mui/material";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
} from "@react-google-maps/api";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  GOOGLE_MAPS_API_KEY,
  MAP_MAX_MARKERS,
  MAP_CONTAINER_STYLE,
} from "./constants";
import type { Branch } from "./types";
import {
  createDefaultMarkerIcon,
  createSelectedMarkerIcon,
  createUserLocationIcon,
} from "./utils/markerIcons";

export function BranchMap({
  branches,
  selectedBranch,
  userLocation,
  onSelectBranch,
}: {
  branches: Branch[];
  selectedBranch: Branch | null;
  userLocation: { lat: number; lng: number } | null;
  onSelectBranch: (branch: Branch) => void;
}) {
  const mapRef = useRef<any>(null);
  const apiKey = GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey });

  const isFiniteLatLng = (lat: unknown, lng: unknown) => Number.isFinite(lat) && Number.isFinite(lng);

  const safeSelected = useMemo(
    () =>
      selectedBranch && isFiniteLatLng(selectedBranch.lat, selectedBranch.lng)
        ? selectedBranch
        : null,
    [selectedBranch]
  );

  const safeBranches = useMemo(
    () => branches.filter((b) => isFiniteLatLng(b.lat, b.lng)),
    [branches]
  );
  const mapBranches = useMemo(() => {
    if (safeBranches.length <= MAP_MAX_MARKERS) return safeBranches;
    const limited = safeBranches.slice(0, MAP_MAX_MARKERS);
    if (safeSelected && !limited.some((b) => b.id === safeSelected.id)) {
      return [safeSelected, ...limited.slice(0, MAP_MAX_MARKERS - 1)];
    }
    return limited;
  }, [safeBranches, safeSelected]);

  const mapCenter = useMemo(
    () =>
      safeSelected
        ? { lat: safeSelected.lat, lng: safeSelected.lng }
        : userLocation && isFiniteLatLng(userLocation.lat, userLocation.lng)
          ? userLocation
          : DEFAULT_CENTER,
    [safeSelected, userLocation]
  );

  const mapOptions = useMemo(
    () => ({
      clickableIcons: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy" as const,
      minZoom: 5,
      maxZoom: 18,
      fullscreenControlOptions: {
        position: (globalThis as any).google?.maps?.ControlPosition?.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: (globalThis as any).google?.maps?.ControlPosition?.RIGHT_BOTTOM,
      },
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#d3dae3" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b7280" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#bdefff" }],
        },
      ],
    }),
    []
  );

  const markerIcon = useMemo(() => {
    if (!isLoaded || !(globalThis as any).google) return undefined;
    return {
      url: createDefaultMarkerIcon(),
      scaledSize: new (globalThis as any).google.maps.Size(34, 46),
      anchor: new (globalThis as any).google.maps.Point(17, 44),
    };
  }, [isLoaded]);

  const selectedMarkerIcon = useMemo(() => {
    if (!isLoaded || !(globalThis as any).google) return undefined;
    return {
      url: createSelectedMarkerIcon(),
      scaledSize: new (globalThis as any).google.maps.Size(40, 54),
      anchor: new (globalThis as any).google.maps.Point(20, 52),
    };
  }, [isLoaded]);

  const userLocationIcon = useMemo(() => {
    if (!isLoaded || !(globalThis as any).google) return undefined;
    return {
      url: createUserLocationIcon(),
      scaledSize: new (globalThis as any).google.maps.Size(28, 28),
      anchor: new (globalThis as any).google.maps.Point(14, 14),
    };
  }, [isLoaded]);

  const handleMapLoad = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !safeSelected) return;
    mapRef.current.panTo({ lat: safeSelected.lat, lng: safeSelected.lng });
    mapRef.current.setZoom(14);
  }, [safeSelected]);

  if (!apiKey) {
    return <Alert severity="error">Google Maps key missing: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</Alert>;
  }
  if (loadError) return <Alert severity="error">Failed to load Google Maps.</Alert>;
  if (!isLoaded) return <Box sx={{ height: 360, borderRadius: 2, background: "#f8fafc" }} />;

  return (
    <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e2e8f0", height: 360 }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={mapCenter}
        zoom={safeSelected ? 14 : DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {userLocation && isFiniteLatLng(userLocation.lat, userLocation.lng) && (
          <MarkerF
            position={userLocation}
            icon={userLocationIcon}
          />
        )}
        {mapBranches
          .filter((branch) => !safeSelected || branch.id !== safeSelected.id)
          .map((branch) => (
            <MarkerF
              key={branch.id}
              position={{ lat: branch.lat, lng: branch.lng }}
              icon={markerIcon}
              onClick={() => onSelectBranch(branch)}
            />
          ))}

        {safeSelected && (
          <MarkerF
            key={`selected-${safeSelected.id}`}
            position={{ lat: safeSelected.lat, lng: safeSelected.lng }}
            icon={selectedMarkerIcon}
            animation={
              (globalThis as any).google
                ? (globalThis as any).google.maps.Animation.DROP
                : undefined
            }
            onClick={() => onSelectBranch(safeSelected)}
          />
        )}
      </GoogleMap>
    </Box>
  );
}

