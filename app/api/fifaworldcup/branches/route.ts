import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_BRANCH_BACKEND_BASE_URL = "https://coopengage.coopbankoromiasc.com";

type BranchRow = {
  id: number;
  branchCode: string;
  companyName: string | null;
  nameAddress: string | null;
  mnemonic: string | null;
  languageCode: string | null;
  district: string | null;
  lat: number;
  lng: number;
  phone: string | null;
};

function toBranchRow(item: unknown): BranchRow | null {
  if (item === null || typeof item !== "object") return null;
  const src = item as Record<string, unknown>;
  const id = Number(src.id ?? 0);
  const branchCode = String(src.branchCode ?? "").trim();
  const lat = Number(src.lat);
  const lng = Number(src.lng);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!branchCode || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id,
    branchCode,
    companyName: src.companyName == null ? null : String(src.companyName),
    nameAddress: src.nameAddress == null ? null : String(src.nameAddress),
    mnemonic: src.mnemonic == null ? null : String(src.mnemonic),
    languageCode: src.languageCode == null ? null : String(src.languageCode),
    district: src.district == null ? null : String(src.district),
    lat,
    lng,
    phone: src.phone == null ? null : String(src.phone),
  };
}

export async function GET() {
  try {
    const base =
      process.env.FIFA_WORLD_CUP_BRANCH_BACKEND_BASE_URL?.trim() ||
      DEFAULT_BRANCH_BACKEND_BASE_URL;
    const res = await fetch(`${base}/api/branches`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to load branches" },
        { status: 502 }
      );
    }
    const data = await res.json();
    const mapped = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)
        ? (data as { data: unknown[] }).data
        : [];
    const branches = mapped.map(toBranchRow).filter((b): b is BranchRow => b !== null);
    return NextResponse.json({ success: true, branches }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load branches" },
      { status: 502 }
    );
  }
}

