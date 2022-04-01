import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Program, Provider } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

import type { AttributeConfig, METADATA_GENERATOR_PROGRAM } from "./constants";
import {
  METADATA_GENERATOR_ADDRESS,
  METADATA_GENERATOR_IDL,
} from "./constants";
import { findMetadatConfigId } from "./pda";

export const createMetadataConfig = async (
  connection: Connection,
  wallet: Wallet,
  mint: PublicKey,
  configName: string,
  attributes: AttributeConfig[]
): Promise<TransactionInstruction> => {
  const provider = new Provider(connection, wallet, {});
  const metadataGeneratorProgram = new Program<METADATA_GENERATOR_PROGRAM>(
    METADATA_GENERATOR_IDL,
    METADATA_GENERATOR_ADDRESS,
    provider
  );
  const [[metadataConfigId], mintMetadataId] = await Promise.all([
    findMetadatConfigId(configName),
    Metadata.getPDA(mint),
  ]);
  return metadataGeneratorProgram.instruction.createMetadataConfig(
    { seedString: configName, attributes: attributes },
    {
      accounts: {
        metadataConfig: metadataConfigId,
        mintMetadata: mintMetadataId,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};
