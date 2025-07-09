import { NextResponse } from "next/server";

export function middleware(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // const cspHeader = ``;

  // const cspHeader = `
  //     default-src 'self';
  //     script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}';
  //     style-src 'self' 'unsafe-inline';
  //     img-src 'self' blob: data:;
  //     font-src 'self';
  //     object-src 'none';
  //     base-uri 'self';
  //     form-action 'self';
  //     frame-ancestors 'none';
  //     upgrade-insecure-requests;
  // `;

  const cspHeader = `
      default-src 'self';
      script-src  'nonce-${nonce}';
      script-src-elem 'self' 'nonce-${nonce}' https://maps.googleapis.com https://maps.gstatic.com https://fonts.googleapis.com;
      style-src-elem 'self' https://fonts.googleapis.com;
      connect-src 'self' https://maps.googleapis.com;
      img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
  `;

  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-nonce", nonce);
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  response.cookies.set("nonce", nonce, { httpOnly: false, path: "/" });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
