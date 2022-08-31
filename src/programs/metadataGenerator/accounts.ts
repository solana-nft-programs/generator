import type { AccountData } from "@cardinal/common";
import { Program, AnchorProvider } from "@project-serum/anchor";
import type * as web3 from "@solana/web3.js";

import type { GENERATOR_PROGRAM, MetadataConfigData } from "./constants";
import { GENERATOR_ADDRESS, GENERATOR_IDL } from "./constants";

export const getMetadataConfig = async (
  connection: web3.Connection,
  metadataConfigId: web3.PublicKey
): Promise<AccountData<MetadataConfigData>> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const generatorProgram = new Program<GENERATOR_PROGRAM>(
    GENERATOR_IDL,
    GENERATOR_ADDRESS,
    provider
  );

  const parsed = (await generatorProgram.account.metadataConfig.fetch(
    metadataConfigId
  )) as MetadataConfigData;
  return {
    parsed,
    pubkey: metadataConfigId,
  };
};
