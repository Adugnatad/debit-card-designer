// types.ts
export interface orderPayload {
  name: string;
  email?: string;
  accountNumber: string;
  // image: any;
  list_of_phoneNumbers?: string[];
  pickup_location: string;
  requestType: string;
  user_id: string;
  session_token: string;
  snapshotId: string;
}

export interface SendOrderData {
  email: string;
  name: string;
  accountNumber: string;
  pickup_location: string;
  group_id: string;
  user_id: string;
  // session_token: string;
  // snapshotId: string;
}

import axios from "axios";
import { baseUrl } from "../constant";

export const submitOrder = async (payload: orderPayload): Promise<void> => {
  try {
    await axios.post(
      `${baseUrl}/cards/${payload.user_id}/create-card`,
      payload,
      {
        headers: {
          // "Content-Type": "multipart/form-data",
          "X-Session-Token": payload.session_token,
        },
      }
    );
  } catch (error: any) {
    // console.log(error.response);
    throw new Error("Order failed");
  }
};

export const confirmInvitation = async (
  payload: SendOrderData
): Promise<void> => {
  try {
    await axios.post(`${baseUrl}/cards/invitation/card/confirm`, payload, {
      headers: {
        "Content-Type": "application/json",
        // "X-Session-Token": payload.session_token,
      },
    });
  } catch (error: any) {
    // console.log("confirm error", error.response.data);
    if (error.response && error.response.data && error.response.data.err) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to confirm invitation");
  }
};
