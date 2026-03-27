"use client";

import { useEffect, useMemo, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "../constants";
import type { Branch } from "../types";
import {
  buildBranchSearchIndex,
  searchIndexedBranches,
} from "../utils/branchSearchIndex";

export const useBranchSearch = (branches: Branch[]) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const indexed = useMemo(() => buildBranchSearchIndex(branches), [branches]);
  const filtered = useMemo(
    () => searchIndexedBranches(indexed, debounced),
    [indexed, debounced]
  );
  return { query, setQuery, filtered };
};

