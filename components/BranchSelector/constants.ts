export const DEFAULT_CENTER = { lat: 9.03, lng: 38.74 };
export const DEFAULT_ZOOM = 7;
export const SELECTED_ZOOM = 14;
export const SEARCH_DEBOUNCE_MS = 300;
export const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
export const LIST_MAX_HEIGHT = 360;
export const MAP_MAX_MARKERS = 300;
export const BRAND_COLORS = {
  primary: "#00adef",
  primaryHover: "#0096c9",
  secondary: "#235d71",
  accent: "#38bdf8",
  userLocation: "#00d4ff",
};
export const CLUSTER_OPTIONS = {
  minimumClusterSize: 3,
  maxZoom: 16,
  gridSize: 50,
};

// Branch list is loaded via same-origin `/api/branches` (proxied server-side).
// Set BRANCH_BACKEND_BASE_URL in env to point the proxy at another host.
export const BRANCHES_API_PATH = "/api/branches";

/** @deprecated Use BRANCHES_API_PATH from the browser. Server reads BRANCH_BACKEND_BASE_URL. */
export const BRANCH_BACKEND_BASE_URL = "https://coopengage.coopbankoromiasc.com";

/** Dropped after fetch; match is case-insensitive on companyName or nameAddress (exact). */
export const EXCLUDED_BRANCH_NAMES_LOWER = new Set<string>(["ijo old branch"]);
export const GOOGLE_MAPS_API_KEY = "AIzaSyCgNHw8Dx5xHOGOCpyrWAWt-7nzCp2k6E4";

