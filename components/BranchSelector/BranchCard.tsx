"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import { MapPin, Phone } from "lucide-react";
import type { Branch } from "./types";

export function BranchCard({
  branch,
  selected,
  onSelect,
}: {
  branch: Branch;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        p: 1,
        borderRadius: 2,
        border: selected ? "1px solid #00adef" : "1px solid #e2e8f0",
        backgroundColor: selected ? "rgba(0,173,239,0.06)" : "#fff",
        cursor: "pointer",
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.2 }}>
        {branch.companyName || "Branch"}
      </Typography>
      <Box sx={{ color: "#64748b", fontSize: "0.74rem", mt: 0.4, display: "flex", alignItems: "center", gap: 0.5 }}>
        <MapPin size={13} />
        <span>{branch.nameAddress || "-"}</span>
      </Box>
      <Box sx={{ color: "#64748b", fontSize: "0.74rem", mt: 0.3, display: "flex", alignItems: "center", gap: 0.5 }}>
        <Phone size={12} />
        <span>{branch.phone || "-"}</span>
      </Box>
      <Box sx={{ mt: 0.8, display: "flex", gap: 0.55, flexWrap: "wrap" }}>
        {branch.district && (
          <Chip
            size="small"
            label={branch.district}
            sx={{
              height: 22,
              "& .MuiChip-label": { px: 0.9, fontSize: "0.72rem", fontWeight: 500 },
            }}
          />
        )}
        {typeof branch.distance === "number" && (
          <Chip
            size="small"
            label={`${branch.distance.toFixed(1)} km`}
            sx={{
              height: 22,
              backgroundColor: "#e8f7ef",
              border: "1px solid #9fd9b4",
              color: "#166534",
              "& .MuiChip-label": { px: 0.9, fontSize: "0.72rem", fontWeight: 700 },
            }}
          />
        )}
      </Box>
      <Button
        size="small"
        variant="contained"
        sx={{
          mt: 0.75,
          ml: "auto",
          display: "flex",
          backgroundColor: "#00adef",
          minHeight: 30,
          px: 1.5,
          fontSize: "0.72rem",
          fontWeight: 700,
          "&:hover": { backgroundColor: "#0098d1" },
        }}
        onClick={onSelect}
      >
        Select This Branch
      </Button>
    </Box>
  );
}

