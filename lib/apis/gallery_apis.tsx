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
  const response = await axios.get(`${BASE_URL}/api/v1/cards/card-designs/`);
  return response.data.results;
};
