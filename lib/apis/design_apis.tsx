import axios from "axios";

// types.ts
export interface Design {
  id: string;
  request_type: string;
  image: string;
  creator_name: string;
}

// api.ts
export const getDesign = async (id: string): Promise<Design> => {
  const response = await axios.get(
    `https://9r7j860h-8000.uks1.devtunnels.ms/api/v1/cards/${id}/invitation-card-confirm/`
  );
  return response.data;
};
