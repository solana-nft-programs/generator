import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import { METADATA_CONFIG_SEED, METADATA_GENERATOR_ADDRESS } from ".";

/**
 * Finds the metadata config id.
 * @returns
 */
export const findMetadatConfigId = async (
  configName: string
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(METADATA_CONFIG_SEED),
      utils.bytes.utf8.encode(configName),
    ],
    METADATA_GENERATOR_ADDRESS
  );
};
