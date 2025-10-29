import axios from "axios";
import { DesignSnapshot } from "../types";
import { baseUrl } from "../constant";

// types.ts
// export interface Design {
//   id: string;
//   request_type: string;
//   image: string;
//   creator_name: string;
// }

// api.ts
export const getDesign = async (id: string): Promise<DesignSnapshot | null> => {
  try {
    const response = await axios.get(`${baseUrl}/snapshots/${id}`);
    // console.log("response", baseUrl, response.data)
    return response.data;
  } catch (error: any) {
    // console.log("errw", error)
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch design");
  }
};


export const getCardDesignById = async (id: string): Promise<DesignSnapshot | null> => {
  try {
    const response = await axios.get(`${baseUrl}/cards/${id}/design`);
    // console.log("response", baseUrl, response.data)
    return response.data;
  } catch (error: any) {
    // console.log("errw", error)
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch design");
  }
};
