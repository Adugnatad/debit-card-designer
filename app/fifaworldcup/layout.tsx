import type { ReactNode } from "react";
import Script from "next/script";
import { headers } from "next/headers";
import { FIFA_CUP_LOADER_SRC } from "./fifaLoaderAsset";

const GA_MEASUREMENT_ID = "G-9FE7R8MJ5H";
const GOOGLE_ADS_ID = "AW-18103005190";
const META_PIXEL_ID = "236856830933633";

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
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
      <Script id="meta-pixel-init" nonce={nonce} strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {children}
    </>
  );
}
