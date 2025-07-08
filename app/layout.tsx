import type React from "react";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import Script from "next/script";
import "./globals.css";
import { headers } from "next/headers";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Custom Debit Card Designer",
  description: "Design your own personalized debit card",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = headers().get("nonce")?.value || "";
  return (
    <QueryProvider>
      <html lang="en">
        <body>
          <Script id="custom" nonce={nonce} strategy="afterInteractive" />
          {children}
        </body>
      </html>
    </QueryProvider>
  );
}
