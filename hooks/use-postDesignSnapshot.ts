import { DesignSnapshot } from "@/lib/types";

export const postDesignSnapshot = async (data: DesignSnapshot) => {
  const res = await fetch("/api/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    console.log("error creating design snapshot", error);
    throw new Error(error.message || "Failed to create design snapshot");
  }

  return res.json(); // { id, message }
};

export const fetchLocations = async () => {
  const res = await fetch("/api/locations");
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch locations");
  }
  return res.json();
};
