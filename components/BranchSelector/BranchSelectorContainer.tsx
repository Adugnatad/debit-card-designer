"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Grid, Skeleton, Typography } from "@mui/material";
import { LocateFixed } from "lucide-react";
import { BranchList } from "./BranchList";
import { BranchMap } from "./BranchMap";
import { BRANCH_BACKEND_BASE_URL } from "./constants";
import { SearchBar } from "./SearchBar";
import { useUserLocation } from "./hooks/useUserLocation";
import { useBranchSearch } from "./hooks/useBranchSearch";
import type { Branch } from "./types";
import { sortBranchesByDistance } from "./utils/geolocationUtils";

export function BranchSelectorContainer({
  selectedBranch,
  onBranchSelect,
  onContinue,
  continueLoading = false,
}: {
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch) => void;
  onContinue: () => void | Promise<void>;
  continueLoading?: boolean;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { location, loading: locating, error: locationError, refreshLocation } =
    useUserLocation();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BRANCH_BACKEND_BASE_URL}/api/branches`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load branches");
        const data = await res.json();
        const mapped = Array.isArray(data) ? data : data.data || [];

        // Normalize and keep only valid coordinate rows for map safety.
        const normalized: Branch[] = mapped
          .map((item: any) => {
            const lat = Number(item?.lat);
            const lng = Number(item?.lng);
            return {
              id: Number(item?.id ?? 0),
              branchCode: String(item?.branchCode ?? ""),
              companyName: item?.companyName ?? null,
              nameAddress: item?.nameAddress ?? null,
              mnemonic: item?.mnemonic ?? null,
              languageCode: item?.languageCode ?? null,
              district: item?.district ?? null,
              lat,
              lng,
              phone: item?.phone ?? null,
            } as Branch;
          })
          .filter(
            (b) =>
              Number.isFinite(b.lat) &&
              Number.isFinite(b.lng) &&
              b.id > 0 &&
              Boolean(b.branchCode)
          );

        setBranches(normalized);
      } catch (e: any) {
        setError(e.message || "Failed to load branches");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Ask for location immediately when selector mounts.
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const sorted = useMemo(
    () => sortBranchesByDistance(branches, location),
    [branches, location]
  );
  const { query, setQuery, filtered } = useBranchSearch(sorted);
  const hasSelectedBranch = useMemo(
    () =>
      Boolean(
        selectedBranch &&
          selectedBranch.id > 0 &&
          Number.isFinite(selectedBranch.lat) &&
          Number.isFinite(selectedBranch.lng)
      ),
    [selectedBranch]
  );

  useEffect(() => {
    if (!selectedBranch && filtered.length > 0) onBranchSelect(filtered[0]);
  }, [filtered, selectedBranch, onBranchSelect]);

  if (loading) {
    return (
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "16px",
          border: "1px solid #bae6fd",
          background:
            "linear-gradient(180deg, rgba(242,254,255,0.95) 0%, rgba(255,255,255,0.98) 100%)",
          p: { xs: 2, sm: 2.5 },
          "@keyframes pulseRing": {
            "0%": { transform: "scale(0.7)", opacity: 0.55 },
            "100%": { transform: "scale(1.55)", opacity: 0 },
          },
          "@keyframes floatCore": {
            "0%, 100%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-5px)" },
          },
          "@keyframes shimmer": {
            "0%": { backgroundPosition: "-500px 0" },
            "100%": { backgroundPosition: "500px 0" },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
          <Box
            sx={{
              position: "relative",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: "0",
                borderRadius: "999px",
                border: "2px solid rgba(0, 173, 239, 0.35)",
                animation: "pulseRing 1.6s ease-out infinite",
              }}
            />
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 30% 30%, #7dd3fc 0%, #00adef 70%)",
                animation: "floatCore 1.5s ease-in-out infinite",
                boxShadow: "0 0 12px rgba(0, 173, 239, 0.45)",
              }}
            />
          </Box>
          <Typography sx={{ fontWeight: 700, color: "#0369a1", fontSize: "0.95rem" }}>
            Finding nearest branches...
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Skeleton variant="rounded" height={42} sx={{ borderRadius: "10px" }} />
          <Skeleton variant="rounded" height={36} sx={{ borderRadius: "10px" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" }, gap: 1.2 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: "12px" }} />
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: "12px" }} />
          </Box>
          <Box
            sx={{
              height: 46,
              borderRadius: "12px",
              background:
                "linear-gradient(90deg, rgba(186,230,253,0.65) 25%, rgba(125,211,252,0.95) 50%, rgba(186,230,253,0.65) 75%)",
              backgroundSize: "900px 100%",
              animation: "shimmer 1.3s linear infinite",
            }}
          />
        </Box>
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
      <SearchBar
        query={query}
        setQuery={setQuery}
        count={filtered.length}
        sortedByDistance={Boolean(location)}
      />

      <Button
        variant="outlined"
        onClick={refreshLocation}
        disabled={locating}
        startIcon={<LocateFixed size={15} />}
        sx={{
          alignSelf: "stretch",
          height: { xs: "34px", sm: "36px" },
          borderRadius: "9px",
          borderColor: "#00adef",
          color: "#00adef",
          textTransform: "none",
          fontSize: { xs: "0.78rem", sm: "0.82rem" },
          fontWeight: 600,
          py: 0,
          "&:hover": {
            borderColor: "#00adef",
            backgroundColor: "rgba(0, 173, 239, 0.06)",
          },
        }}
      >
        {locating ? "Finding location..." : "Refresh My Location"}
      </Button>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <BranchList
            branches={filtered}
            selectedBranch={selectedBranch}
            onSelect={onBranchSelect}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <BranchMap
            branches={filtered}
            selectedBranch={selectedBranch}
            userLocation={location}
            onSelectBranch={onBranchSelect}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        disabled={!hasSelectedBranch || continueLoading}
        onClick={() => void onContinue()}
        sx={{
          backgroundColor: "#00adef",
          "&:hover": {
            backgroundColor: "#4dc8f0",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(0, 173, 239, 0.3)",
          },
          "&:active": {
            backgroundColor: "#7dd3fc",
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            background: "rgba(0, 173, 239, 0.3)",
            color: "rgba(255, 255, 255, 0.7)",
          },
          height: { xs: "44px", sm: "48px" },
          borderRadius: "12px",
          textTransform: "none",
          fontSize: { xs: "0.9375rem", sm: "1rem" },
          fontWeight: 700,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {continueLoading ? "Submitting…" : "Continue"}
      </Button>
    </Box>
  );
}

