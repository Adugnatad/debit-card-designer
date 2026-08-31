"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { LIST_MAX_HEIGHT } from "./constants";
import { BranchCard } from "./BranchCard";
import type { Branch } from "./types";

const ITEM_ESTIMATED_HEIGHT = 150;
const OVERSCAN_ITEMS = 3;

export function BranchList({
  branches,
  selectedBranch,
  onSelect,
}: {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelect: (branch: Branch) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const total = branches.length;
  const visibleCount = Math.ceil(LIST_MAX_HEIGHT / ITEM_ESTIMATED_HEIGHT) + OVERSCAN_ITEMS * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_ESTIMATED_HEIGHT) - OVERSCAN_ITEMS);
  const endIndex = Math.min(total, startIndex + visibleCount);
  const topSpacer = startIndex * ITEM_ESTIMATED_HEIGHT;
  const bottomSpacer = Math.max(0, (total - endIndex) * ITEM_ESTIMATED_HEIGHT);
  const visible = useMemo(
    () => branches.slice(startIndex, endIndex),
    [branches, startIndex, endIndex]
  );

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
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {topSpacer > 0 && <Box sx={{ height: topSpacer }} />}
      {visible.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          selected={selectedBranch?.id === branch.id}
          onSelect={() => onSelect(branch)}
        />
      ))}
      {bottomSpacer > 0 && <Box sx={{ height: bottomSpacer }} />}
    </Box>
  );
}

