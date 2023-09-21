import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import * as GENERATOR_TYPES from "../../idl/solana_nft_programs_generator";

export const GENERATOR_ADDRESS = new PublicKey(
  "genSsTXZaAGH1kRUe74TXzwuernqZhJksHvpXiAxBQT"
);

export const METADATA_CONFIG_SEED = "metadata-config";

export type GENERATOR_PROGRAM = GENERATOR_TYPES.SolanaNftProgramsGenerator;

export const GENERATOR_IDL = GENERATOR_TYPES.IDL;

export type RewardDistributorTypes = AnchorTypes<GENERATOR_PROGRAM>;

type Accounts = RewardDistributorTypes["Accounts"];
export type MetadataConfigData = Accounts["metadataConfig"];

export type AttributeConfig = {
  address: PublicKey;
  accountType: string;
  fields: string[];
};
