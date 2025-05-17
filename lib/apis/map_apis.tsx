import axios from "axios";
const BASE_URL = process.env.BASE_URL;

// types.ts
export interface Location {
  name: string;
  lat: number;
  lng: number;
}

// api.ts
export const getLocation = async (): Promise<Location[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/branches/`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch locations");
  }
};
