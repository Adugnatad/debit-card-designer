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

export type IndexedBranch = {
  branch: Branch;
  terms: string;
};

export const buildBranchSearchIndex = (branches: Branch[]): IndexedBranch[] =>
  branches.map((branch) => ({ branch, terms: toTerms(branch) }));

export const searchIndexedBranches = (
  indexed: IndexedBranch[],
  query: string
) => {
  const q = query.trim().toLowerCase();
  if (!q) return indexed.map((x) => x.branch);

  return [...indexed]
    .map((x) => {
      const starts = x.terms.startsWith(q) ? 2 : 0;
      const contains = x.terms.includes(q) ? 1 : 0;
      return { branch: x.branch, score: starts + contains };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.branch.distance ?? Infinity) - (b.branch.distance ?? Infinity);
    })
    .map((x) => x.branch);
};

