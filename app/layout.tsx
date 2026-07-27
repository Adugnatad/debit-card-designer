import type React from "react";
import type { Metadata } from "next";
import QueryProvider from "@/components/QueryProvider";
import Script from "next/script";
import "./globals.css";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Custom Debit Card Designer",
  description: "Design your own personalized debit card",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const nonce = hdrs.get("nonce") || "";
  return (
    <QueryProvider>
      <html lang="en">
        <body>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=AW-18103005190"
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="google-ads" strategy="afterInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18103005190');
            `}
          </Script>
          {children}
        </body>
      </html>
    </QueryProvider>
  );
}
