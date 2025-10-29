import axios from "axios";
import { baseUrl } from "../constant";
import { GalleryType } from "../types";

// types.ts
export interface CardDesign {
  backgroundImage: string | null;
  backgroundColor: string;
  customText: string;
  textColor: string;
  fontFamily: string;
  textPosition: {
    x: number;
    y: number;
  };
  logoPosition: {
    x: number;
    y: number;
  };
  cardDetailsTextColor: string;
  logo: string | null;
}

// api.ts
export const getGalleryDesigns = async (): Promise<GalleryType> => {
  try {
    const response = await axios.get(`${baseUrl}/gallery`);
    return response.data as GalleryType;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch card designs");
  }
};
