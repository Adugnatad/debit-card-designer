// types.ts
export interface orderPayload {
  name: string;
  email?: string;
  accountNumber: string;
  image: any;
  list_of_phoneNumbers?: string[];
  pickup_location: string;
  requestType: string;
  user_id: string;
  session_token: string;
}

export interface SendOrderData {
  email: string;
  name: string;
  accountNumber: string;
  pickup_location: string;
  group_id: string;
  user_id: string;
  session_token: string;
}

// apis.ts
//   import { axiosConfig as axios } from "../axios";
import axios from "axios";
const BASE_URL = process.env.BASE_URL;

export const submitOrder = async (payload: orderPayload): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.email) {
      formData.append("email", payload.email);
    }
    formData.append("requestType", payload.requestType);
    formData.append("accountNumber", payload.accountNumber);
    formData.append("pickup_location", payload.pickup_location);
    formData.append("image", payload.image);

    if (
      payload.list_of_phoneNumbers &&
      payload.list_of_phoneNumbers[0] !== ""
    ) {
      payload.list_of_phoneNumbers.forEach((phone, index) => {
        formData.append(`list_of_phoneNumbers[${index}]`, phone);
      });
    }

    await axios.post(
      `${BASE_URL}/api/v1/cards/${payload.user_id}/create-card/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Session-Token": payload.session_token,
        },
      }
    );
  } catch (error: any) {
    console.log(error.response);
    throw new Error("Order failed");
  }
};

export const confirmInvitation = async (
  payload: SendOrderData
): Promise<void> => {
  try {
    await axios.post(
      `${BASE_URL}/api/v1/cards/${payload.group_id}/invitation-card-confirm/`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": payload.session_token,
        },
      }
    );
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to confirm invitation");
  }
};
