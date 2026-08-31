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

// Static backend/map config for branch selector flow
export const BRANCH_BACKEND_BASE_URL = "https://coopengage.coopbankoromiasc.com";

/** Dropped after fetch; match is case-insensitive on companyName or nameAddress (exact). */
export const EXCLUDED_BRANCH_NAMES_LOWER = new Set<string>(["ijo old branch"]);

/**
 * Branch codes no longer available; dropped after fetch (match is case-insensitive).
 */
export const EXCLUDED_BRANCH_CODES = new Set<string>([
  "ET0010105",
  "ET0010164",
  "ET0010169",
  "ET0010236",
  "ET0010272",
  "ET0010322",
  "ET0010346",
  "ET0010355",
  "ET0010388",
  "ET0010405",
  "ET0010420",
  "ET0010421",
  "ET0010424",
  "ET0010434",
  "ET0010443",
  "ET0010448",
  "ET0010456",
  "ET0010459",
  "ET0010470",
  "ET0010480",
  "ET0010490",
  "ET0010509",
  "ET0010525",
  "ET0010526",
  "ET0010527",
  "ET0010537",
  "ET0010542",
  "ET0010544",
  "ET0010557",
  "ET0010559",
  "ET0010567",
  "ET0010576",
  "ET0010589",
  "ET0010594",
  "ET0010613",
  "ET0010615",
  "ET0010616",
  "ET0010620",
  "ET0010622",
  "ET0010632",
  "ET0010633",
  "ET0010646",
  "ET0010647",
  "ET0010672",
  "ET0010685",
  "ET0010699",
  "ET0010700",
  "ET0010701",
  "ET0010703",
  "ET0010704",
  "ET0010707",
  "ET0010710",
  "ET0010711",
  "ET0010712",
  "ET0010713",
  "ET0010716",
  "ET0010724",
  "ET0010729",
  "ET0010736",
  "ET0010738",
  "ET0010739",
  "ET0010740",
  "ET0010743",
  "ET0010744",
  "ET0010748",
  "ET0010751",
  "ET0010752",
  "ET0010755",
  "ET0010774",
]);
export const GOOGLE_MAPS_API_KEY = "AIzaSyCgNHw8Dx5xHOGOCpyrWAWt-7nzCp2k6E4";

