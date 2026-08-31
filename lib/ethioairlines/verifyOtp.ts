import { getEthioAirlinesVerifyOtpUrl } from "./ethioAirlinesConstants";
import {
  postEthioAirlinesJson,
  type EthioAirlinesResult,
} from "./gatewayFetch";

export type VerifyOtpResult = EthioAirlinesResult;

/** POST /verifyOtp -- body `{ phoneNumber, otpCode }`. The phone comes from sendOtp. */
export async function verifyEthioAirlinesOtp(
  phoneNumber: string,
  otpCode: string,
  preferredAccessToken?: string | null
): Promise<VerifyOtpResult> {
  return postEthioAirlinesJson(
    getEthioAirlinesVerifyOtpUrl(),
    { phoneNumber, otpCode },
    preferredAccessToken
  );
}
