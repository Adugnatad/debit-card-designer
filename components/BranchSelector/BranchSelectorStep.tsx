"use client";

import type { Branch, BranchSelectorStepProps } from "./types";
import { BranchSelectorContainer } from "./BranchSelectorContainer";

export function BranchSelectorStep({
  selectedBranch,
  onBranchSelect,
  onContinue,
  continueLoading = false,
}: BranchSelectorStepProps & {
  onContinue: () => void | Promise<void>;
  continueLoading?: boolean;
}) {
  return (
    <BranchSelectorContainer
      selectedBranch={selectedBranch as Branch | null}
      onBranchSelect={onBranchSelect}
      onContinue={onContinue}
      continueLoading={continueLoading}
    />
  );
}

