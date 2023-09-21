/* eslint-disable no-empty */
import type { CertificateData } from "@solana-nft-programs/certificates";
import {
  CERTIFICATE_IDL,
  CERTIFICATE_PROGRAM_ID,
  certificateIdForMint,
} from "@solana-nft-programs/certificates";
import { getBatchedMultipleAccounts } from "@solana-nft-programs/common";
import type { AccountData } from "@solana-nft-programs/token-manager";
import {
  timeInvalidator,
  useInvalidator,
} from "@solana-nft-programs/token-manager/dist/cjs/programs";
import type { PaidClaimApproverData } from "@solana-nft-programs/token-manager/dist/cjs/programs/claimApprover";
import {
  CLAIM_APPROVER_ADDRESS,
  CLAIM_APPROVER_IDL,
} from "@solana-nft-programs/token-manager/dist/cjs/programs/claimApprover";
import type { TimeInvalidatorData } from "@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator";
import {
  TIME_INVALIDATOR_ADDRESS,
  TIME_INVALIDATOR_IDL,
} from "@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator";
import type { TokenManagerData } from "@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager";
import {
  TOKEN_MANAGER_ADDRESS,
  TOKEN_MANAGER_IDL,
} from "@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager";
import { findTokenManagerAddress } from "@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager/pda";
import type { UseInvalidatorData } from "@solana-nft-programs/token-manager/dist/cjs/programs/useInvalidator";
import {
  USE_INVALIDATOR_ADDRESS,
  USE_INVALIDATOR_IDL,
} from "@solana-nft-programs/token-manager/dist/cjs/programs/useInvalidator";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import {
  MasterEditionV1Data,
  MasterEditionV2Data,
  MetadataKey,
} from "@metaplex-foundation/mpl-token-metadata";
import { BorshAccountsCoder } from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import type {
  AccountInfo,
  Connection,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import fetch from "node-fetch";

import type { NFTMetadata } from "../metadata-generator/generator";

export type TokenData = {
  tokenManagerData?: AccountData<TokenManagerData> | null;
  metaplexData?: AccountData<metaplex.MetadataData> | null;
  useInvalidatorData?: AccountData<UseInvalidatorData> | null;
  timeInvalidatorData?: AccountData<TimeInvalidatorData> | null;
  certificateData?: AccountData<CertificateData> | null;
  metadata?: { pubkey: PublicKey; data: NFTMetadata } | null;
};

export type AccountType =
  | "metaplexMetadata"
  | "editionData"
  | "tokenManager"
  | "tokenAccount"
  | "timeInvalidator"
  | "paidClaimApprover"
  | "useInvalidator"
  | "certificate";

export type AccountTypeData = {
  type: AccountType;
  displayName?: string;
};

export type AccountDataById = {
  [accountId: string]:
    | (AccountData<CertificateData> & AccountInfo<Buffer> & AccountTypeData)
    | (AccountData<TokenManagerData> & AccountInfo<Buffer> & AccountTypeData)
    | (AccountData<PaidClaimApproverData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<TimeInvalidatorData> & AccountInfo<Buffer> & AccountTypeData)
    | (AccountData<UseInvalidatorData> & AccountInfo<Buffer> & AccountTypeData)
    | (spl.AccountInfo & AccountTypeData)
    | (AccountData<metaplex.MetadataData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<metaplex.EditionData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<metaplex.MasterEditionData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<undefined> & AccountInfo<Buffer> & AccountTypeData);
};

export const deserializeAccountInfos = (
  accountIds: (PublicKey | null)[],
  accountInfos: (AccountInfo<Buffer | ParsedAccountData> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    const ownerString = accountInfo?.owner.toString();
    switch (ownerString) {
      case CERTIFICATE_PROGRAM_ID.toString():
        try {
          const type = "certificate";
          const coder = new BorshAccountsCoder(CERTIFICATE_IDL);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as CertificateData;
          acc[accountIds[i]!.toString()] = {
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          };
        } catch (e) {}
        return acc;
      case TOKEN_MANAGER_ADDRESS.toString():
        try {
          const type = "tokenManager";
          const coder = new BorshAccountsCoder(TOKEN_MANAGER_IDL);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as TokenManagerData;
          acc[accountIds[i]!.toString()] = {
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          };
        } catch (e) {}
        return acc;
      case TIME_INVALIDATOR_ADDRESS.toString():
        try {
          const type = "timeInvalidator";
          const coder = new BorshAccountsCoder(TIME_INVALIDATOR_IDL);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as TimeInvalidatorData;
          acc[accountIds[i]!.toString()] = {
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          };
        } catch (e) {}
        return acc;
      case USE_INVALIDATOR_ADDRESS.toString():
        try {
          const type = "useInvalidator";
          const coder = new BorshAccountsCoder(USE_INVALIDATOR_IDL);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as UseInvalidatorData;
          acc[accountIds[i]!.toString()] = {
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          };
        } catch (e) {}
        return acc;
      case CLAIM_APPROVER_ADDRESS.toString():
        try {
          const type = "paidClaimApprover";
          const coder = new BorshAccountsCoder(CLAIM_APPROVER_IDL);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as PaidClaimApproverData;
          acc[accountIds[i]!.toString()] = {
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          };
        } catch (e) {}
        return acc;
      case spl.TOKEN_PROGRAM_ID.toString():
        try {
          acc[accountIds[i]!.toString()] = {
            type: "tokenAccount",
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...((accountInfo?.data as ParsedAccountData).parsed
              ?.info as spl.AccountInfo),
          };
        } catch (e) {}
        return acc;
      case metaplex.MetadataProgram.PUBKEY.toString():
        try {
          acc[accountIds[i]!.toString()] = {
            type: "metaplexMetadata",
            pubkey: accountIds[i]!,
            parsed: metaplex.MetadataData.deserialize(
              accountInfo?.data as Buffer
            ) as metaplex.MetadataData,
            ...(accountInfo as AccountInfo<Buffer>),
          };
        } catch (e) {}
        try {
          const key =
            accountInfo === null || accountInfo === void 0
              ? void 0
              : (accountInfo.data as Buffer)[0];
          let parsed;
          if (key === MetadataKey.EditionV1) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parsed = MasterEditionV1Data.deserialize(
              accountInfo?.data as Buffer
            );
          } else if (
            key === MetadataKey.MasterEditionV1 ||
            key === MetadataKey.MasterEditionV2
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parsed = MasterEditionV2Data.deserialize(
              accountInfo?.data as Buffer
            );
          }
          if (parsed) {
            acc[accountIds[i]!.toString()] = {
              type: "editionData",
              pubkey: accountIds[i]!,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              parsed,
              ...(accountInfo as AccountInfo<Buffer>),
            };
          }
        } catch (e) {}
        return acc;
      default:
        return acc;
    }
  }, {} as AccountDataById);
};

export const accountDataById = async (
  connection: Connection,
  ids: (PublicKey | null)[]
): Promise<AccountDataById> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null);
  const accountInfos = await getBatchedMultipleAccounts(
    connection,
    filteredIds,
    { encoding: "jsonParsed" }
  );
  return deserializeAccountInfos(filteredIds, accountInfos);
};

export async function getTokenData(
  connection: Connection,
  mintId: PublicKey,
  getMetadata = false
): Promise<TokenData> {
  const [[metaplexId], [tokenManagerId], [certificateId]] = await Promise.all([
    metaplex.MetadataProgram.find_metadata_account(mintId),
    findTokenManagerAddress(mintId),
    certificateIdForMint(mintId),
  ]);

  const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
    timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
  ]);

  const accountsById = await accountDataById(connection, [
    metaplexId,
    tokenManagerId,
    timeInvalidatorId,
    useInvalidatorId,
    certificateId,
  ]);

  let metadata: { pubkey: PublicKey; data: NFTMetadata } | null = null;
  const metaplexData = accountsById[
    metaplexId.toString()
  ] as AccountData<metaplex.MetadataData>;
  if (
    metaplexData &&
    getMetadata &&
    !metaplexData.parsed.data.uri.includes("host")
  ) {
    try {
      const uri = metaplexData.parsed.data.uri;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const json = (await fetch(uri).then((r: Response) =>
        r.json()
      )) as NFTMetadata;
      metadata = {
        pubkey: metaplexData.pubkey,
        data: json,
      };
    } catch (e) {
      console.log("Failed to get metadata data", e);
    }
  }

  return {
    metaplexData,
    useInvalidatorData: useInvalidatorId
      ? (accountsById[
          useInvalidatorId.toString()
        ] as AccountData<UseInvalidatorData>)
      : undefined,
    timeInvalidatorData: timeInvalidatorId
      ? (accountsById[
          timeInvalidatorId.toString()
        ] as AccountData<TimeInvalidatorData>)
      : undefined,
    tokenManagerData: tokenManagerId
      ? (accountsById[
          tokenManagerId.toString()
        ] as AccountData<TokenManagerData>)
      : undefined,
    certificateData: certificateId
      ? (accountsById[certificateId.toString()] as AccountData<CertificateData>)
      : undefined,
    metadata,
  };
}
