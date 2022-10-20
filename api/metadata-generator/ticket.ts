import type { Attribute } from "./attributes";
import type { NFTMetadata } from "./generator";

export const getDefaultTicketMetadata = (
  mintId: string,
  nameParam: string,
  cluster: string,
  attributes: Attribute[]
): NFTMetadata => {
  const imageUrl = `https://nft.cardinal.so/img/${mintId}${
    nameParam ? `?name=${encodeURIComponent(nameParam)}` : ""
  }${cluster ? `${nameParam ? "&" : "?"}cluster=${cluster}` : ""}`;
  return {
    name: "Ticket",
    symbol: "TICKET",
    description: `This is a Cardinal-powered NFT representing your ticket for this event`,
    seller_fee_basis_points: 0,
    attributes: attributes,
    collection: {
      name: "Tickets",
      family: "Tickets",
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
