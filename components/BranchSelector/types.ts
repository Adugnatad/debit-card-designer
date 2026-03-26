export interface Branch {
  id: number;
  branchCode: string;
  companyName?: string | null;
  nameAddress?: string | null;
  mnemonic?: string | null;
  languageCode?: string | null;
  district?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  distance?: number;
}

export interface BranchWithDistance extends Branch {
  distance?: number;
}

export interface BranchSelectorStepProps {
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch) => void;
}

