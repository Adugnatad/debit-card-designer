import axios from "axios";

export const sendOtp = async (data: {
  phoneNumber: string;
  id: string;
}): Promise<{ success: boolean }> => {
  const response = await axios.post(
    "http://localhost:4000/api/otp/send-otp",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to send otp");
  }
  return response.data;
};

export const verifyOtp = async (data: {
  id: string;
  otp: string;
}): Promise<{ success: boolean }> => {
  const response = await axios.post(
    "https://your-ajpi-domain.com/verify-otp",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to give ratings");
  }
  return response.data;
};
