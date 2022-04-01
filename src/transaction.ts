import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { AttributeConfig } from "./programs/metadataGenerator";
import { createMetadataConfig } from "./programs/metadataGenerator/instruction";

export const withCreateMetadataConfig = async (
  connection: Connection,
  wallet: Wallet,
  mintId: PublicKey,
  configName: string,
  attributes: AttributeConfig[]
): Promise<Transaction> => {
  const transaction = new Transaction();
  transaction.add(
    await createMetadataConfig(
      connection,
      wallet,
      mintId,
      configName,
      attributes
    )
  );
  return transaction;
};
