import type { Branch } from "../types";

const toTerms = (branch: Branch) =>
  [
    branch.companyName,
    branch.nameAddress,
    branch.district,
    branch.branchCode,
    branch.mnemonic,
    branch.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const searchBranches = (branches: Branch[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return branches;

  return [...branches]
    .map((b) => {
      const t = toTerms(b);
      const starts = t.startsWith(q) ? 2 : 0;
      const contains = t.includes(q) ? 1 : 0;
      return { b, score: starts + contains };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.b.distance ?? Infinity) - (b.b.distance ?? Infinity);
    })
    .map((x) => x.b);
};

