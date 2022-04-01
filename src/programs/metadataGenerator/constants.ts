import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import * as METADATA_GENERATOR_TYPES from "../../idl/cardinal_metadata_generator";

export const METADATA_GENERATOR_ADDRESS = new PublicKey(
  "Fr66EvvzsspaWwC2TiuSPg6RDwjypvDgshSucFjtnYEK"
);

export const METADATA_CONFIG_SEED = "metadata-config";

export type METADATA_GENERATOR_PROGRAM =
  METADATA_GENERATOR_TYPES.CardinalMetadataGenerator;

export const METADATA_GENERATOR_IDL = METADATA_GENERATOR_TYPES.IDL;

export type RewardDistributorTypes = AnchorTypes<METADATA_GENERATOR_PROGRAM>;

type Accounts = RewardDistributorTypes["Accounts"];
export type MetadataConfigData = Accounts["metadataConfig"];

export type AttributeConfig = {
  address: PublicKey;
  accountType: string;
  fields: string[];
};
