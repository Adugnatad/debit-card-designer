import axios from "axios";
const MAP_URL = process.env.NEXT_PUBLIC_MAP_URL;

// types.ts
export interface Location {
  name: string;
  lat: number;
  lng: number;
}

// api.ts
export const getLocation = async (): Promise<Location[]> => {
  const response = await axios.get(`${MAP_URL}/branches/`);
  return response.data;
};
