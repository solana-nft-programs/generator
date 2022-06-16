type MintClass = {
  name: string;
  symbol: string;
  image: string;
  uri: string;
  tokenManger?: {
    timeLockSeconds: number;
    type: "return" | "release";
  };
  creators?: string[];
};

export const mintClasses: MintClass[] = [
  {
    name: "Monke NFT NYC",
    symbol: "MONKE",
    image: "./monke-nyc-nft-event.png",
    uri: "uri",
    tokenManger: {
      timeLockSeconds: 10,
      type: "release",
    },
  },
];
