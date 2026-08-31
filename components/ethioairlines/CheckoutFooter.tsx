"use client";

import { Lock } from "lucide-react";
import { BANK_NAME } from "@/lib/ethioairlines/brandAssets";

export default function CheckoutFooter() {
  return (
    <footer className="mt-auto px-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-1.5 border-t border-[#e0f2fe] px-4 py-4 text-center">
        <span className="flex items-center gap-1.5 text-[0.75rem] text-slate-500">
          <Lock size={12} className="shrink-0" />
          Processed securely by {BANK_NAME}
        </span>
        <span className="text-[0.6875rem] text-slate-400">
          © {new Date().getFullYear()} {BANK_NAME}
        </span>
      </div>
    </footer>
  );
}
