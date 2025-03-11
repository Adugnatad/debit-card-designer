import axios from "axios";

// types.ts
export interface Design {
  image: FileList | File[];
}

// api.ts
export const getDesign = async (id: string): Promise<Design> => {
  const response = await axios.get(
    "http://localhost:4000/api/requirement/getRequirements"
  );
  const design = response.data;
  return {
    image: design.image,
  };
};
