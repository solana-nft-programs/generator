export const getTwitterMetadata = (
  fullName: string,
  mintId: string,
  ownerId: string,
  cluster: string
) => {
  const imageUrl = `https://api.cardinal.so/img/${mintId}${
    cluster ? `?cluster=${cluster}` : ""
  }`;
  return {
    name: fullName,
    symbol: "NAME",
    description: `This is a Cardinal-powered non-transferable NFT representing your ownership of ${fullName}`,
    seller_fee_basis_points: 0,
    external_url: `https://twitter.cardinal.so/${ownerId}`,
    attributes: {},
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
