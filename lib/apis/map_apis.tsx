import axios from "axios";
import { baseUrl } from "../constant";

// types.ts
export interface Location {
  name: string;
  lat: number;
  lng: number;
}

// api.ts
export const getLocation = async (): Promise<Location[]> => {
  try {
    const response = await axios.get(`${baseUrl}/branches`);
    if (
      response.status === 200 &&
      response.data &&
      Array.isArray(response.data)
    ) {
      return response.data.map((loc: any) => ({
        name: loc.name,
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lng),
      })) as Location[];
    }
    return [];
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch locations");
  }
};
