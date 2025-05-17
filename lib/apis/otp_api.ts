import axios from "axios";
const BASE_URL = process.env.BASE_URL;
export const sendOtp = async (data: {
  phoneNumber: string;
}): Promise<{ id: string; message: string }> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/users/send-otp/`,
      { phone_number: data.phoneNumber },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // console.log(response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to send otp");
  }
};

export const verifyOtp = async (data: {
  id: string;
  otp: string;
}): Promise<{
  id: string;
  accounts: [{ id: any; accountNumber: string }];
  session_token: string;
}> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/users/${data.id}/verify-otp/`,
      { otp: data.otp },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to verify otp");
  }
};
