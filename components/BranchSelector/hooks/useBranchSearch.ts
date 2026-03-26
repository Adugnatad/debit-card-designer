"use client";

import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "../constants";
import type { Branch } from "../types";
import { searchBranches } from "../utils/branchSearchIndex";

export const useBranchSearch = (branches: Branch[]) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = searchBranches(branches, debounced);
  return { query, setQuery, filtered };
};

