/**
 * Client-generated correlation id for the /confirm call.
 *
 * NOT a UUID. The only known-good upstream sample is `eDiFHSF1HJFnona` -- exactly
 * 15 mixed-case alphanumerics with no hyphens -- so a 36-char dashed UUID is a
 * plausible rejection on both length and charset. `generateFundTransferMessageId`
 * in lib/fifaworldcup/requestNewCardService.ts sets the same precedent of matching
 * the upstream's observed format rather than reaching for a standard id.
 *
 * Isomorphic: `crypto.getRandomValues` is global in browsers and Node 18+.
 */

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const DEFAULT_LENGTH = 15;

export const ETHIO_AIRLINES_MESSAGE_ID_PATTERN = /^[A-Za-z0-9]{8,64}$/;

export function generateEthioAirlinesMessageId(
  length: number = DEFAULT_LENGTH
): string {
  const size = Math.max(8, Math.min(64, Math.floor(length)));
  const bytes = new Uint8Array(size);

  const webCrypto = globalThis.crypto;
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let out = "";
  for (let i = 0; i < size; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function isValidEthioAirlinesMessageId(v: unknown): v is string {
  return typeof v === "string" && ETHIO_AIRLINES_MESSAGE_ID_PATTERN.test(v);
}
