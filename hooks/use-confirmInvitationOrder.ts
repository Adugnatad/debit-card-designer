// "use client";

import { orderPayload, SendOrderData } from "@/lib/apis/order_api";
import { baseUrl } from "@/lib/constant";
import { AnyLayer, DesignSnapshot } from "@/lib/types";
import axios from "axios";

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
  // const formData = new FormData();

  // formData.append("name", payload.name);
  // if (payload.email) formData.append("email", payload.email);
  // formData.append("requestType", payload.requestType);
  // formData.append("accountNumber", payload.accountNumber);
  // formData.append("pickup_location", payload.pickup_location);
  // formData.append("user_id", payload.user_id);

  // if (payload.image) {
  //   const response = await fetch(payload.image);
  //   const blob = await response.blob();
  //   const file = new File([blob], "design.jpg", { type: blob.type });
  //   formData.append("image", file);
  // }

  // if (payload.list_of_phoneNumbers?.length) {
  //   payload.list_of_phoneNumbers.forEach((phone, index) => {
  //     formData.append(`list_of_phoneNumbers[${index}]`, phone);
  //   });
  // }

  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "X-Session-Token": payload.session_token,
    },
    // body: formData,
    body: JSON.stringify(payload),
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

export const sendDesignSnapshot = async (data: DesignSnapshot) => {
  try {
    const formData = buildDesignSnapshotFormData(data);
    // console.log("FormData prepared:", formData);
    const res = await axios(`${baseUrl}/design/snapshots`, {
      method: "POST",
      // headers: { "Content-Type": "application/json" },
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
    });

    // if (res.status !== 200) {
    //   const error = res.data;
    //   throw new Error(error.message || "Failed to create design");
    // }

    // console.log(res.data);

    return res.data;
  } catch (error) {
    // console.log("catch error here", error);
    // console.error("Error sending design snapshot:", error);
    throw error;
  }
};

export function normalizeDesign(design: DesignSnapshot) {
  const formData = new FormData();
  formData.append("bg_mode", design.bgMode);
  formData.append("bg_color", design.bgColor);
  formData.append("bg_x", String(design.bg?.x));
  formData.append("bg_y", String(design.bg?.y));
  formData.append("bg_w", String(design.bg?.w));
  formData.append("bg_h", String(design.bg?.h));

  // for (let i = 0; i <= design.layers.length; i++) {
  //   const layer = design.layers[i];
  //   formData.append(`layers[${i}][id]`, layer.id);
  //   formData.append(`layers[${i}][name]`, layer.name);
  //   formData.append(`layers[${i}][type]`, layer.type);
  //   formData.append(`layers[${i}][x]`, String(layer.x));
  //   formData.append(`layers[${i}][y]`, String(layer.y));
  //   formData.append(`layers[${i}][w]`, String(layer.w));
  //   formData.append(`layers[${i}][h]`, String(layer.h));
  //   formData.append(`layers[${i}][src]`, base64ToFile());
  //   // formData.append(`layers[${i}][src]`, base64ToFile(layer.));
  // }

  return formData;
}

// export function buildDesignSnapshotFormData(
//   snapshot: DesignSnapshot
// ): FormData {
//   let snapshotLayers: AnyLayer[] = [];
//   const formData = new FormData();
//   // console.log("Building FormData for design snapshot:", snapshot);
//   // Add snapshot-level fields
//   formData.append("v", String(snapshot.v));
//   formData.append("bgMode", snapshot.bgMode);
//   formData.append("bgColor", snapshot.bgColor);
//   if (snapshot.bgImage) {
//     // console.log("image is here", snapshot.bgImage);
//     const matches = snapshot.bgImage.match(/^data:(.+);base64,(.*)$/);
//     if (!matches) throw new Error("Invalid base64 string");

//     const mimeType = matches[1]; // e.g., "image/png"
//     const ext = mimeType.split("/")[1]; // "png"
//     const data = matches[2]; // actual base64 data

//     // Convert base64 → binary → blob
//     const byteChars = atob(data);
//     const byteNumbers = new Array(byteChars.length);
//     for (let i = 0; i < byteChars.length; i++) {
//       byteNumbers[i] = byteChars.charCodeAt(i);
//     }
//     const byteArray = new Uint8Array(byteNumbers);
//     const blob = new Blob([byteArray], { type: mimeType });
//     formData.append("bgImage", blob, `upload.${ext}`);
//   }
//   formData.append("bg", JSON.stringify(snapshot.bg));
//   // formData.append("bg_y", String(snapshot.bg.y));
//   // formData.append("bg_w", String(snapshot.bg.w));
//   // formData.append("bg_h", String(snapshot.bg.h));
//   // formData.append("bg_lock_aspect", String(snapshot.bg.lockAspect));
//   // formData.append("layers", JSON.stringify(snapshot.layers));
//   formData.append("gradient", JSON.stringify(snapshot.gradient));
//   console.log("before converting: ", JSON.stringify(snapshot.layers, null, 2));

//   snapshot.layers.forEach((layer, index) => {
//     // formData.append(`layers[${index}][name]`, layer.name);
//     // formData.append(`layers[${index}].type`, layer.type);
//     // formData.append(`layers[${index}].locked`, layer.locked ? "true" : "false");
//     // formData.append(`layers[${index}].x`, layer.x ? String(layer.x) : "0");
//     // formData.append(`layers[${index}].y`, layer.y ? String(layer.y) : "0");
//     // formData.append(`layers[${index}].w`, layer.w ? String(layer.w) : "0");
//     // formData.append(`layers[${index}].h`, layer.h ? String(layer.h) : "0");
//     // formData.append(`layers[${index}].z`, layer.z ? String(layer.z) : "0");
//     // if (layer.type === "text") {
//     //   if ("text" in layer)
//     //     formData.append(`layers[${index}].text`, layer.text ?? "");
//     //   if ("color" in layer)
//     //     formData.append(`layers[${index}].color`, layer.color ?? "");
//     //   if ("fontFamily" in layer)
//     //     formData.append(`layers[${index}].fontFamily`, layer.fontFamily ?? "");
//     //   if ("fontWeight" in layer)
//     //     formData.append(
//     //       `layers[${index}].fontWeight`,
//     //       String(layer.fontWeight ?? 400)
//     //     );
//     //   if ("align" in layer)
//     //     formData.append(`layers[${index}].align`, layer.align ?? "left");
//     // }

//     if (layer.type === "image" && layer.src) {
//       const matches = layer.src.match(/^data:(.+);base64,(.*)$/);
//       if (matches) {
//         const mimeType = matches[1]; // e.g., "image/png"
//         const ext = mimeType.split("/")[1]; // "png"
//         const data = matches[2]; // actual base64 data

//         // Convert base64 → binary → blob
//         const byteChars = atob(data);
//         const byteNumbers = new Array(byteChars.length);
//         for (let i = 0; i < byteChars.length; i++) {
//           byteNumbers[i] = byteChars.charCodeAt(i);
//         }
//         const byteArray = new Uint8Array(byteNumbers);
//         const blob = new Blob([byteArray], { type: mimeType });
//         formData.append(`layerImages`, blob, `layer_${index}.${ext}`);
//         // formData.delete(`layers[${index}].src`);
//         // create a new layer without src
//         // const { src, ...newLayer } = layer;

//         snapshotLayers[index] = { ...layer, src: "" };
//       } else {
//         // formData.append(`layers[${index}].src`, layer.src);
//         snapshotLayers[index] = layer;
//       }
//     } else {
//       snapshotLayers[index] = layer;
//     }
//   });
//   // console.log("snapshotLayers:", JSON.stringify(snapshotLayers, null, 2));
//   formData.append("layers", JSON.stringify(snapshotLayers));
//   // formData.forEach((value, key) => {
//   //   console.log(`FormData Entry: ${key} = ${value}`);
//   // });
//   return formData;
// }


export function buildDesignSnapshotFormData(
  snapshot: DesignSnapshot
): FormData {
  let snapshotLayers: AnyLayer[] = [];
  const formData = new FormData();

  formData.append("v", String(snapshot.v));
  formData.append("bgMode", snapshot.bgMode);
  formData.append("bgColor", snapshot.bgColor);
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
    formData.append("bgImage", snapshot.bgImage as string)
  }
  const bg = {...snapshot.bg, lockAspect: snapshot.bg.lockAspect ?? false}

  formData.append("bg", JSON.stringify(bg));

  // console.log("bg is", JSON.stringify(snapshot.bg))

  formData.append("gradient", JSON.stringify(snapshot.gradient));
  // console.log("before converting: ", JSON.stringify(snapshot.layers, null, 2));

  snapshot.layers.forEach((layer, index) => {

    const normalizedType = layer.type.replace(/_/g, "-");
    layer.type = normalizedType as any

    layer.locked = layer.locked ?? false

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
