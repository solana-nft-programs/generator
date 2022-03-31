import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  Connection,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import { findTokenManagerAddress } from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import {
  timeInvalidator,
  tokenManager,
  useInvalidator,
} from "@cardinal/token-manager/dist/cjs/programs";
import fetch from "node-fetch";
import { AccountData } from "@cardinal/token-manager";
import { TokenManagerData } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import { TimeInvalidatorData } from "@cardinal/token-manager/dist/cjs/programs/timeInvalidator";
import { UseInvalidatorData } from "@cardinal/token-manager/dist/cjs/programs/useInvalidator";
import {
  CertificateData,
  certificateIdForMint,
  getCertificate,
} from "@cardinal/certificates";

export type TokenData = {
  tokenAccount?: {
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  };
  tokenManagerData?: AccountData<TokenManagerData> | null;
  metaplexData?: metaplex.Metadata | null;
  useInvalidatorData?: AccountData<UseInvalidatorData> | null;
  timeInvalidatorData?: AccountData<TimeInvalidatorData> | null;
  certificateData?: AccountData<CertificateData> | null;
  metadata?: any | null;
};

export async function getTokenData(
  connection: Connection,
  mintId: PublicKey,
  getMetadata: boolean = false
): Promise<TokenData> {
  const [[metaplexId], [tokenManagerId], [certificateId]] = await Promise.all([
    PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
        metaplex.MetadataProgram.PUBKEY.toBuffer(),
        mintId.toBuffer(),
      ],
      metaplex.MetadataProgram.PUBKEY
    ),
    findTokenManagerAddress(mintId),
    certificateIdForMint(mintId),
  ]);

  const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
    timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
  ]);

  const [
    metaplexData,
    tokenManagerData,
    timeInvalidatorData,
    useInvalidatorData,
    certificateData,
  ] = await Promise.all([
    metaplex.Metadata.load(connection, metaplexId).catch((e) => {
      console.log("Failed to get metaplex data", e);
      return null;
    }),
    tokenManager.accounts
      .getTokenManager(connection, tokenManagerId)
      .catch((e) => {
        console.log("Failed to get token manager data", e);
        return null;
      }),
    timeInvalidator.accounts
      .getTimeInvalidator(connection, timeInvalidatorId)
      .catch((e) => {
        console.log("Failed to get time invalidator data", e);
        return null;
      }),
    useInvalidator.accounts
      .getUseInvalidator(connection, useInvalidatorId)
      .catch((e) => {
        console.log("Failed to get use invalidator data", e);
        return null;
      }),
    getCertificate(connection, certificateId).catch((e) => {
      console.log("Failed to get certificate data", e);
      return null;
    }),
  ]);

  let metadata: any | null = null;
  if (
    metaplexData &&
    getMetadata &&
    !metaplexData.data.data.uri.includes("cardinal")
  ) {
    try {
      const json = await fetch(metaplexData.data.data.uri).then((r) =>
        r.json()
      );
      metadata = { pubkey: metaplexData.pubkey, data: json };
    } catch (e) {
      console.log("Failed to get metadata data", e);
    }
  }

  return {
    metaplexData,
    tokenManagerData,
    useInvalidatorData,
    timeInvalidatorData,
    certificateData,
    metadata,
  };
}
