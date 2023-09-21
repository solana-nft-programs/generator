import { capitalizeFirstLetter } from "@solana-nft-programs/common";

import type { NFTMetadata } from "./generator";

export const getDefaultMetadata = (
  namespace: string,
  fullName: string,
  mintId: string,
  nameParam: string,
  cluster: string
): NFTMetadata => {
  const imageUrl = `https://nft.host.so/img/${mintId}${
    nameParam ? `?name=${encodeURIComponent(nameParam)}` : ""
  }${cluster ? `${nameParam ? "&" : "?"}cluster=${cluster}` : ""}`;
  return {
    name: fullName,
    symbol: "NAME",
    description: `This is a NFT representing your ${namespace} identity`,
    seller_fee_basis_points: 0,
    attributes: [],
    collection: {
      name: capitalizeFirstLetter(namespace),
      family: capitalizeFirstLetter(namespace),
    },
    properties: {
      files: [
        {
          uri: imageUrl,
          type: "image/png",
        },
      ],
      category: "image",
      maxSupply: 1,
      creators: [],
    },
    image: imageUrl,
  };
};
