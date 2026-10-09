import type { Metadata } from "next";
import CardRequestFlow from "@/components/cardrequest/CardRequestFlow";
import { normalizeAccountParam } from "@/lib/cardrequest/accountParam";

export const metadata: Metadata = {
  title: "Request a Debit Card · Coop Bank",
  description: "Request a Cooperative Bank of Oromia debit card online.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * General (non-campaign) card request. Reads `?account=` on the server rather
 * than via useSearchParams, which avoids the Next 16 Suspense requirement.
 */
export default async function CardRequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return <CardRequestFlow initialAccount={normalizeAccountParam(sp.account)} />;
}
