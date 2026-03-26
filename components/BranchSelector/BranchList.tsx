"use client";

import { Box } from "@mui/material";
import { LIST_MAX_HEIGHT } from "./constants";
import { BranchCard } from "./BranchCard";
import type { Branch } from "./types";

export function BranchList({
  branches,
  selectedBranch,
  onSelect,
}: {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelect: (branch: Branch) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        maxHeight: LIST_MAX_HEIGHT,
        overflowY: "auto",
        pr: 0.5,
        border: "1px solid #dbeafe",
        borderRadius: 2,
        p: 1,
        backgroundColor: "#f8fcff",
      }}
    >
      {branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          selected={selectedBranch?.id === branch.id}
          onSelect={() => onSelect(branch)}
        />
      ))}
    </Box>
  );
}

