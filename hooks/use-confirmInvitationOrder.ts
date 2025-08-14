import { orderPayload, SendOrderData } from "@/lib/apis/order_api";

export const confirmInvitationOrder = async (payload: SendOrderData) => {
  const res = await fetch("/api/invitation-confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to confirm invitation");
  }

  return res.json();
};

export const postOrder = async (payload: orderPayload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  if (payload.email) formData.append("email", payload.email);
  formData.append("requestType", payload.requestType);
  formData.append("accountNumber", payload.accountNumber);
  formData.append("pickup_location", payload.pickup_location);
  formData.append("user_id", payload.user_id);

  if (payload.image) {
    const response = await fetch(payload.image);
    const blob = await response.blob();
    const file = new File([blob], "design.jpg", { type: blob.type });
    formData.append("image", file);
  }

  if (payload.list_of_phoneNumbers?.length) {
    payload.list_of_phoneNumbers.forEach((phone, index) => {
      formData.append(`list_of_phoneNumbers[${index}]`, phone);
    });
  }

  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "X-Session-Token": payload.session_token,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to submit order");
  }

  return res.json();
};

export const postSendOtp = async (phoneNumber: string) => {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send OTP");
  }

  return res.json(); // { id, message }
};

export const postVerifyOtp = async (id: string, otp: string) => {
  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, otp }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to verify OTP");
  }

  return res.json(); // { id, accounts, session_token }
};
