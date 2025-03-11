// types.ts
export interface orderPayload {
  fullName: string;
  email: string;
  phone: string;
  orderType: string;
  account: string;
  groupDesign?: FileList | File[];
  groupPhones?: string[];
}

// apis.ts
//   import { axiosConfig as axios } from "../axios";
import axios from "axios";

export const submitOrder = async (payload: orderPayload): Promise<void> => {
  console.log(payload);
  const response = await axios.post(
    `/api/orders`,
    {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      orderType: payload.orderType,
      account: payload.account,
      image: payload.groupDesign,
      creator: payload.fullName,
    },
    {
      withCredentials: true,
    }
  );

  if (response.status !== 201) {
    throw new Error("KYC form submission failed");
  }
};
