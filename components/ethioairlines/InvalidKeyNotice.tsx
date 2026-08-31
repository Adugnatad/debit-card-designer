"use client";

import { Button } from "@mui/material";
import { AlertTriangle } from "lucide-react";
import CheckoutHeader from "./CheckoutHeader";
import CheckoutFooter from "./CheckoutFooter";
import { primaryButtonSx } from "@/lib/ethioairlines/checkoutFieldStyles";
import {
  AIRLINE_NAME,
  PAGE_BG,
  resolveReturnUrl,
} from "@/lib/ethioairlines/brandAssets";

/**
 * Dead end for a malformed link. Reuses the same shell as the checkout so it
 * reads as the same product rather than a generic error page. Makes no API
 * calls and mints no token.
 */
export default function InvalidKeyNotice() {
  const returnUrl = resolveReturnUrl();

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: PAGE_BG }}
    >
      <CheckoutHeader />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-[#e0f2fe] bg-white p-6 text-center">
          <div className="mb-4 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle size={26} className="text-amber-500" />
            </span>
          </div>

          <h1 className="mb-2 text-[1.0625rem] font-bold text-slate-800">
            This payment link is not valid
          </h1>
          <p className="mb-5 text-[0.875rem] leading-relaxed text-slate-500">
            The link may be incomplete, already used, or expired. Please start
            the payment again from the {AIRLINE_NAME} app or website.
          </p>

          <Button
            component="a"
            href={returnUrl}
            rel="noopener noreferrer"
            fullWidth
            variant="contained"
            sx={primaryButtonSx}
          >
            Return to {AIRLINE_NAME}
          </Button>
        </div>
      </div>

      <CheckoutFooter />
    </main>
  );
}
