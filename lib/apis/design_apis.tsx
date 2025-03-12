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

  // return {
  //   id: response.data.design.id,
  //   request_type: response.data.design.request_type,
  //   image: response.data.design.image,
  //   creator_name: response.data.design.creator_name,
  // };
  return response.data;
};
