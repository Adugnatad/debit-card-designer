import axios from "axios";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// types.ts
export interface Design {
  id: string;
  request_type: string;
  image: string;
  creator_name: string;
}

console.log("BASE_URL", BASE_URL);

// api.ts
export const getDesign = async (id: string): Promise<Design> => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/cards/${id}/invitation-card-confirm/`
  );
  return response.data;
};
