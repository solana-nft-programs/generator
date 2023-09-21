import fetch from "node-fetch";

import type { TokenData } from "../common/tokenData";

export const getTicketImageURL = (ticketId: string) => {
  return `https://firebasestorage.googleapis.com/v0/b/solana-nft-programs-events.appspot.com/o/tickets%2F${ticketId}%2Fimage.png?alt=media`;
};

export async function getTicketImage(tokenData: TokenData): Promise<Buffer> {
  const mintName = tokenData?.metaplexData?.parsed.data.name;
  if (!mintName) throw "Mint name not found";

  const imageURL = getTicketImageURL(mintName.toString());
  const response = await fetch(imageURL);
  return Buffer.from(await response.arrayBuffer());
}
