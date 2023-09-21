import type { NFTMetadata } from "./generator";

export const getTwitterMetadata = (
  fullName: string,
  mintId: string,
  ownerId: string,
  nameParam: string,
  cluster: string
): NFTMetadata => {
  const imageUrl = `https://nft.host.so/img/${mintId}?${
    nameParam ? `&name=${encodeURIComponent(nameParam)}` : ""
  }${cluster ? `&cluster=${cluster}` : ""}`;
  return {
    name: fullName,
    symbol: "NAME",
    description: `This is a non-transferable NFT representing your ownership of ${fullName}`,
    seller_fee_basis_points: 0,
    external_url: `https://twitter.host.so/${ownerId}`,
    attributes: [],
    collection: {
      name: "Twitter",
      family: "Twitter",
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
