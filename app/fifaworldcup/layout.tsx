import type { ReactNode } from "react";
import Script from "next/script";
import { headers } from "next/headers";
import { FIFA_CUP_LOADER_SRC } from "./fifaLoaderAsset";

const GA_MEASUREMENT_ID = "G-9FE7R8MJ5H";

export default async function FifaWorldCupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const hdrs = await headers();
  const nonce = hdrs.get("nonce") || "";

  return (
    <>
      <link rel="preload" href={FIFA_CUP_LOADER_SRC} as="image" />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-fifaworldcup-init" nonce={nonce} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      {children}
    </>
  );
}
