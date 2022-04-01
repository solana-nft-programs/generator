import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import { METADATA_CONFIG_SEED, METADATA_GENERATOR_ADDRESS } from ".";

/**
 * Finds the metadata config id.
 * @returns
 */
export const findMetadatConfigId = async (
  mintId: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(METADATA_CONFIG_SEED), mintId.toBuffer()],
    METADATA_GENERATOR_ADDRESS
  );
};
