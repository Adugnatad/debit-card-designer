import { getEthioAirlinesConfirmUrl } from "./ethioAirlinesConstants";
import {
  postEthioAirlinesJson,
  type EthioAirlinesResult,
} from "./gatewayFetch";

export type ConfirmResult = EthioAirlinesResult;

export type ConfirmCheckoutInput = {
  /** The `?key=` booking token, opaque and passed through verbatim. */
  checkoutKey: string;
  messageId: string;
  debitAccount: string;
};

/**
 * POST /confirm -- the money-moving step.
 *
 * Always uses the server-minted token. `checkoutKey` is renamed to `token` here
 * and nowhere else -- that rename is the whole reason for the naming convention.
 */
export async function confirmEthioAirlinesCheckout(
  input: ConfirmCheckoutInput
): Promise<ConfirmResult> {
  return postEthioAirlinesJson(getEthioAirlinesConfirmUrl(), {
    token: input.checkoutKey,
    messageId: input.messageId,
    debitAccount: input.debitAccount,
  });
}
