import axios from "axios";
import { DesignSnapshot } from "../types";
const BASE_URL = process.env.BASE_URL;

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
    const response = await axios.get(`${BASE_URL}/cards/${id}/design`);
    console.log("---- design type", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch design");
  }
};
