import { getEthioAirlinesSendOtpUrl } from "./ethioAirlinesConstants";
import {
  postEthioAirlinesJson,
  type EthioAirlinesResult,
} from "./gatewayFetch";

export type SendOtpResult = EthioAirlinesResult;

/** POST /sendOtp -- body `{ accountNumber }`, returns `{ success, phoneNumber, message }`. */
export async function sendEthioAirlinesOtp(
  accountNumber: string
): Promise<SendOtpResult> {
  return postEthioAirlinesJson(getEthioAirlinesSendOtpUrl(), { accountNumber });
}
