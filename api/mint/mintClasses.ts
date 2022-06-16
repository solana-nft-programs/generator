type MintClass = {
  name: string;
  symbol: string;
  image: string;
  uri?: string;
  tokenManger?: {
    timeLockSeconds: number;
    type: "return" | "release";
  };
  creators?: { pubkey: string; share: number }[];
};

export const mintClasses: MintClass[] = [
  {
    name: "Monke NFT NYC",
    symbol: "MONKE",
    image: "./monke-nyc-nft-event.png",
    tokenManger: {
      timeLockSeconds: 10,
      type: "release",
    },
  },
];
