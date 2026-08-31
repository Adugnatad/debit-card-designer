"use client";

import { Box, Chip, TextField } from "@mui/material";
import { MapPin, Search } from "lucide-react";

export function SearchBar({
  query,
  setQuery,
  count,
  sortedByDistance,
}: {
  query: string;
  setQuery: (v: string) => void;
  count: number;
  sortedByDistance: boolean;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#00adef", fontWeight: 700 }}>
        <MapPin size={15} />
        <span>Select a nearest branch</span>
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search branches..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: "inline-flex", alignItems: "center", mr: 0.8, color: "#64748b" }}>
              <Search size={15} />
            </Box>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: "#ffffff",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "& fieldset": {
              borderColor: "#bae6fd",
              borderWidth: "1.5px",
            },
            "&:hover fieldset": {
              borderColor: "#7dd3fc",
              borderWidth: "1.5px",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00adef",
              borderWidth: "2px",
              boxShadow: "0 0 0 3px rgba(0, 173, 239, 0.1)",
            },
            height: { xs: "44px", sm: "48px" },
            fontSize: { xs: "0.9375rem", sm: "1rem" },
          },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontSize: "0.86rem", color: "#475569", fontWeight: 600 }}>{count} branches</Box>
        {sortedByDistance && (
          <Chip
            size="small"
            label="Sorted by distance"
            sx={{
              backgroundColor: "rgba(34,197,94,0.12)",
              color: "#166534",
              border: "1px solid rgba(34,197,94,0.22)",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

