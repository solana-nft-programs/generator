import type { NFTMetadata } from "./generator";

const burnURL = (cluster: string) => {
  if (cluster === "devnet") {
    return "https://dev.host.so/burn";
  }
  return "https://main.host.so/burn";
};

export const getExpiredMetadata = (cluster: string): NFTMetadata => {
  const imageUrl = `https://api.host.so/img/?text=EXPIRED`;
  return {
    name: "EXPIRED",
    symbol: "RCP",
    description: `This is a stale rental receipt from a past rental. Click the link here to burn it ${burnURL(
      cluster
    )}`,
    seller_fee_basis_points: 0,
    external_url: burnURL(cluster),
    attributes: [],
    collection: {
      name: "Expired Receipts",
      family: "Expired Receipts",
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
