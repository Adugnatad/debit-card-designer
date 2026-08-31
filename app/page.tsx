import type { Metadata } from "next";

import AffinityCardPage from "@/components/landing/affinity-card-page";
import EthioAirlinesCheckout from "@/components/ethioairlines/EthioAirlinesCheckout";
import InvalidKeyNotice from "@/components/ethioairlines/InvalidKeyNotice";
import {
  normalizeAccountParam,
  parseCheckoutKey,
} from "@/lib/ethioairlines/checkoutKey";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const key = first((await searchParams).key)?.trim();
  // A checkout URL carries a booking credential -- keep it out of search indexes.
  return key
    ? {
        title: "Pay with Coop Bank · Ethiopian Airlines",
        robots: { index: false, follow: false },
      }
    : {};
}

/**
 * Root route.
 *
 * With no `?key=` this renders the unchanged marketing landing page. With one, it
 * renders the Ethiopian Airlines checkout. Branching on the server (rather than
 * useSearchParams in a client component) avoids the Next 16 Suspense requirement,
 * avoids a flash of the landing page, keeps the marketing bundle off the checkout
 * path, and sanitizes the key before it ever reaches the browser.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = parseCheckoutKey(first(sp.key));

  if (parsed.status === "absent") {
    return <AffinityCardPage />;
  }

  if (parsed.status === "malformed") {
    return <InvalidKeyNotice />;
  }

  return (
    <EthioAirlinesCheckout
      checkoutKey={parsed.key}
      bookingRef={parsed.bookingRef}
      expiresAtMs={parsed.expiresAtMs}
      initialAccount={normalizeAccountParam(first(sp.account))}
    />
  );
}
