// types.ts
export interface orderPayload {
  name: string;
  email?: string;
  accountNumber: string;
  image: string;
  list_of_phoneNumbers?: string[];
  pickup_location: string;
  requestType: string;
  user_id: string;
}

// apis.ts
//   import { axiosConfig as axios } from "../axios";
import axios from "axios";

export const submitOrder = async (payload: orderPayload): Promise<void> => {
  console.log(payload);
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.email) {
    formData.append("email", payload.email);
  }
  formData.append("requestType", payload.requestType);
  formData.append("accountNumber", payload.accountNumber);
  formData.append("pickup_location", payload.pickup_location);

  if (payload.image) {
    const response = await fetch(payload.image);
    const blob = await response.blob();
    const file = new File([blob], "design.jpg", { type: blob.type });
    formData.append("image", file);
  }

  if (payload.list_of_phoneNumbers && payload.list_of_phoneNumbers[0] !== "") {
    payload.list_of_phoneNumbers.forEach((phone, index) => {
      formData.append(`list_of_phoneNumbers[${index}]`, phone);
    });
  }

  const response = await axios.post(
    `https://9r7j860h-8000.uks1.devtunnels.ms/api/v1/cards/${payload.user_id}/create-card/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (response.status !== 201) {
    throw new Error("Order failed");
  }
};
