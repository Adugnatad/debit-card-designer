import type { ReactNode } from "react";

import { FIFA_CUP_LOADER_SRC } from "./fifaLoaderAsset";

export default function FifaWorldCupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <link rel="preload" href={FIFA_CUP_LOADER_SRC} as="image" />
      {children}
    </>
  );
}
