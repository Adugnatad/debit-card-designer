import { BRAND_COLORS } from "../constants";

const encode = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const createDefaultMarkerIcon = () =>
  encode(`
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_COLORS.primary}" />
      <stop offset="100%" stop-color="#0088cc" />
    </linearGradient>
  </defs>
  <path d="M17 2C9.27 2 3 8.27 3 16c0 10.2 12.5 26.2 13.03 26.87a1.2 1.2 0 0 0 1.94 0C18.5 42.2 31 26.2 31 16 31 8.27 24.73 2 17 2z" fill="url(#g1)" stroke="#ffffff" stroke-width="2.6"/>
  <circle cx="17" cy="16" r="5.6" fill="#ffffff"/>
  <circle cx="17" cy="16" r="2.7" fill="${BRAND_COLORS.primary}"/>
</svg>`);

export const createSelectedMarkerIcon = () =>
  encode(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="54" viewBox="0 0 40 54">
  <defs>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_COLORS.secondary}" />
      <stop offset="100%" stop-color="#1a4a5c" />
    </linearGradient>
  </defs>
  <path d="M20 3C11.2 3 4 10.2 4 19c0 11.2 14.2 29.6 14.8 30.3a1.5 1.5 0 0 0 2.4 0C21.8 48.6 36 30.2 36 19 36 10.2 28.8 3 20 3z" fill="url(#g2)" stroke="#ffffff" stroke-width="3"/>
  <circle cx="20" cy="19" r="6.6" fill="#ffffff"/>
  <circle cx="20" cy="19" r="3.2" fill="${BRAND_COLORS.secondary}"/>
</svg>`);

export const createUserLocationIcon = () =>
  encode(`
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="10" fill="none" stroke="${BRAND_COLORS.userLocation}" stroke-width="2" opacity="0.55"/>
  <circle cx="14" cy="14" r="5.5" fill="${BRAND_COLORS.userLocation}" stroke="#ffffff" stroke-width="2"/>
</svg>`);

