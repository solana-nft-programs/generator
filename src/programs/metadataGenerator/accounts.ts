import type { AccountData } from "@cardinal/common";
import { Program, Provider } from "@project-serum/anchor";
import type * as web3 from "@solana/web3.js";

import type {
  METADATA_GENERATOR_PROGRAM,
  MetadataConfigData,
} from "./constants";
import {
  METADATA_GENERATOR_ADDRESS,
  METADATA_GENERATOR_IDL,
} from "./constants";

export const getRewardEntry = async (
  connection: web3.Connection,
  metadataConfigId: web3.PublicKey
): Promise<AccountData<MetadataConfigData>> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new Provider(connection, null, {});
  const metadataGeneratorProgram = new Program<METADATA_GENERATOR_PROGRAM>(
    METADATA_GENERATOR_IDL,
    METADATA_GENERATOR_ADDRESS,
    provider
  );

  const parsed = (await metadataGeneratorProgram.account.metadataConfig.fetch(
    metadataConfigId
  )) as MetadataConfigData;
  return {
    parsed,
    pubkey: metadataConfigId,
  };
};
