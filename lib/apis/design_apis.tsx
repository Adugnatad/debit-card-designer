import axios from "axios";
const BASE_URL = process.env.BASE_URL;

// types.ts
export interface Design {
  id: string;
  request_type: string;
  image: string;
  creator_name: string;
}

// api.ts
export const getDesign = async (id: string): Promise<Design> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/cards/${id}/invitation-card-confirm/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch design");
  }
};
