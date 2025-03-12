import axios from "axios";

export const sendOtp = async (data: {
  phoneNumber: string;
}): Promise<{ id: string; message: string }> => {
  const response = await axios.post(
    "https://9r7j860h-8000.uks1.devtunnels.ms/api/v1/users/send-otp/",
    { phone_number: data.phoneNumber },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status !== 201) {
    throw new Error("Failed to send otp");
  }
  console.log(response.data);
  return response.data;
};

export const verifyOtp = async (data: {
  id: string;
  otp: string;
}): Promise<[{ id: string; accountNumber: string }]> => {
  const response = await axios.post(
    `https://9r7j860h-8000.uks1.devtunnels.ms/api/v1/users/${data.id}/verify-otp/`,
    { otp: data.otp },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to verify otp");
  }
  return response.data.accounts;
};
