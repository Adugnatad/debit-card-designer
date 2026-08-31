import { FIFA_INTERNAL_GATEWAY_BASE_URL } from "./fifaWorldCupConstants";

const DEFAULT_REQUEST_URL = `${FIFA_INTERNAL_GATEWAY_BASE_URL}/cardmanagement/1.0.0/newCardRequest`;

export function getRequestNewCardUrl(): string {
  return (
    process.env.FIFA_WORLD_CUP_REQUEST_NEW_CARD_URL?.trim() ||
    DEFAULT_REQUEST_URL
  );
}
