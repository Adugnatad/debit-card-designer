import axios from "axios";
import { orderPayload, SendOrderData } from "@/lib/apis/order_api";
import { baseUrl } from "@/lib/constant";
import { AnyLayer, DesignSnapshot } from "@/lib/types";

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
  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "X-Session-Token": payload.session_token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to submit order");
  }

  return res.json();
};

export const postSendOtp = async (
  phoneNumber: string,
  verificationMethod: "sms" | "telegram"
) => {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, notify: verificationMethod }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send OTP");
  }

  return res.json();
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

  return res.json();
};

export const sendDesignSnapshot = async (data: DesignSnapshot) => {
  try {
    const formData = buildDesignSnapshotFormData(data);
    const res = await axios(`${baseUrl}/design/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// export function normalizeDesign(design: DesignSnapshot) {
//   const formData = new FormData();
//   formData.append("bg_mode", design.bgMode);
//   formData.append("bg_color", design.bgColor);
//   formData.append("bg_x", String(design.bgX));
//   formData.append("bg_y", String(design.bgY));
//   formData.append("bg_w", String(design.bgW));
//   formData.append("bg_h", String(design.bgH));

//   return formData;
// }

export function buildDesignSnapshotFormData(
  snapshot: DesignSnapshot
): FormData {
  let snapshotLayers: AnyLayer[] = [];
  const formData = new FormData();

  formData.append("v", String(snapshot.v));
  formData.append("bgMode", snapshot.bgMode);
  if (snapshot.bgMode === "color") {
    formData.append("bgColor", snapshot.bgColor);
  } else if (snapshot.bgMode === "gradient") {
    formData.append("gradient", JSON.stringify(snapshot.gradient));
  } else if (snapshot.bgMode === "image") {
    if (snapshot.bgImage && !snapshot.bgImage.includes("/uploads")) {
      const matches = snapshot.bgImage.match(/^data:(.+);base64,(.*)$/);
      if (!matches) throw new Error("Invalid base64 string");

      const mimeType = matches[1]; // e.g., "image/png"
      const ext = mimeType.split("/")[1]; // "png"
      const data = matches[2]; // actual base64 data

      // Convert base64 → binary → blob
      const byteChars = atob(data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      formData.append("bgImage", blob, `upload.${ext}`);
    } else {
      formData.append("bgImage", snapshot.bgImage as string);
    }
    const bg = { ...snapshot.bg, lockAspect: snapshot.bg.lockAspect ?? false };
    formData.append("bg", JSON.stringify(bg));
  }

  snapshot.layers.forEach((layer, index) => {
    const normalizedType = layer.type.replace(/_/g, "-");
    layer.type = normalizedType as any;

    layer.locked = layer.locked ?? false;

    if (layer.type === "image" && layer.src) {
      layer.lockAspectRatio = layer.lockAspectRatio ?? false;
      const matches = layer.src.match(/^data:(.+);base64,(.*)$/);
      if (matches) {
        const mimeType = matches[1]; // e.g., "image/png"
        const ext = mimeType.split("/")[1]; // "png"
        const data = matches[2]; // actual base64 data

        // Convert base64 → binary → blob
        const byteChars = atob(data);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        formData.append(`layerImages`, blob, `layer_${index}.${ext}`);

        snapshotLayers[index] = { ...layer, src: "" };
      } else {
        snapshotLayers[index] = layer;
      }
    } else {
      snapshotLayers[index] = layer;
    }
  });
  formData.append("layers", JSON.stringify(snapshotLayers));

  return formData;
}
