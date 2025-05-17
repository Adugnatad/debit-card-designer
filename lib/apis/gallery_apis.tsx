import axios from "axios";
const BASE_URL = process.env.BASE_URL;

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
export const getGalleryDesigns = async (): Promise<CardDesign[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/cards/card-designs/`);
    return response.data.results;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to fetch card designs");
  }
};
