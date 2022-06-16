export type MintClass = {
  name: string;
  symbol: string;
  image: string;
  uri?: string;
  tokenManger?: {
    timeLockSeconds: number;
    type: "return" | "release";
  };
  creators?: { pubkey: string; share: number }[];
  editions?: {
    masterEdition: string;
  };
};

export const mintClasses: MintClass[] = [
  {
    name: "Monke NFT NYC",
    symbol: "MONKE",
    image: "https://miro.medium.com/max/768/1*CdnqACSFkuzFb3phIrAEsw.png",
    uri: "https://api.cardinal.so/metadata/BiqWonoQop4GhTCrsG312WyJiXsARZg1xgGmn9bmiQJp",
    tokenManger: {
      timeLockSeconds: 10,
      type: "release",
    },
  },
];
