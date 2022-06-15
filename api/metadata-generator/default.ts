import type { NFTMetadata } from "./generator";

export const getDefaultMetadata = (
  namespace: string,
  fullName: string,
  mintId: string,
  nameParam: string,
  cluster: string
): NFTMetadata => {
  const imageUrl = `https://nft.cardinal.so/img/${mintId}${
    nameParam ? `?name=${nameParam}` : ""
  }${cluster ? `${nameParam ? "&" : "?"}cluster=${cluster}` : ""}`;
  return {
    name: fullName,
    symbol: "NAME",
    description: `This is a Cardinal-powered NFT representing your ${namespace} identity`,
    seller_fee_basis_points: 0,
    attributes: [],
    collection: {
      name: "Cardinal",
      family: "cardinal",
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
