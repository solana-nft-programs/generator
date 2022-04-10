import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Program, Provider } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

import type { AttributeConfig, GENERATOR_PROGRAM } from "./constants";
import { GENERATOR_ADDRESS, GENERATOR_IDL } from "./constants";
import { findMetadatConfigId } from "./pda";

export const createMetadataConfig = async (
  connection: Connection,
  wallet: Wallet,
  mint: PublicKey,
  configName: string,
  attributes: AttributeConfig[]
): Promise<TransactionInstruction> => {
  const provider = new Provider(connection, wallet, {});
  const generatorProgram = new Program<GENERATOR_PROGRAM>(
    GENERATOR_IDL,
    GENERATOR_ADDRESS,
    provider
  );
  const [[metadataConfigId], mintMetadataId] = await Promise.all([
    findMetadatConfigId(configName),
    Metadata.getPDA(mint),
  ]);
  return generatorProgram.instruction.createMetadataConfig(
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
