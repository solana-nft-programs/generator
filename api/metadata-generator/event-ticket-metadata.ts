import type { TokenData } from "../common/tokenData";
import { getTicketImageURL } from "../img-generator/event-ticket-image";
import type { NFTMetadata } from "./generator";

export const getTicketMetadataLink = (ticketId: string) => {
  return `https://firebasestorage.googleapis.com/v0/b/cardinal-events.appspot.com/o/tickets%2F${ticketId}%2Fmetadata.json?alt=media`;
};

export function getTicketMetadata(tokenData: TokenData): NFTMetadata {
  const mintName = tokenData?.metaplexData?.parsed.data.name;
  if (!mintName) throw "Mint name not found";
  ``;
  const imageURL = getTicketImageURL(mintName.toString());
  const metadataURL = getTicketMetadataLink(mintName.toString());
  return {
    name: "Cardinal Event",
    symbol: "EVENTS",
    description: "This is a Cardinal Events Ticket",
    seller_fee_basis_points: 0,
    external_url: metadataURL,
    attributes: [],
    collection: {
      name: "Cardinal Events",
      family: "Cardinal Events",
    },
    properties: {
      files: [
        {
          uri: imageURL,
          type: "image/png",
        },
      ],
      category: "image",
      maxSupply: 1,
      creators: [],
    },
    image: imageURL,
  };
}
