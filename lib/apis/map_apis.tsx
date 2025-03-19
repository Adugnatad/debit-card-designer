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
  const response = await axios.get(`${BASE_URL}/branches/`);
  return response.data;
};
