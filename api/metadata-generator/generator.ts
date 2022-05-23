/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-assignment*/
import * as namespaces from "@cardinal/namespaces";
import {
  InvalidationType,
  TokenManagerState,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import fetch from "node-fetch";

import { connectionFor, secondaryConnectionFor } from "../common/connection";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { getOwner } from "../common/utils";
import { getExpiredMetadata } from "./expired";
import { getTwitterMetadata } from "./twitter";

export type NFTMetadata = {
  name?: string;
  symbol?: string;
  description?: string;
  seller_fee_basis_points?: number;
  external_url?: string;
  attributes?: any[];
  collection?: any;
  properties?: any;
  image?: string;
};

export async function getMetadata(
  mintId: string,
  metadataUri: string,
  textParam: string,
  imgParam: string,
  attrs: string,
  cluster: string
): Promise<NFTMetadata> {
  console.log(
    `Getting metadata for mintId (${mintId}) uri (${metadataUri}) textParam (${textParam}) imgParam (${imgParam}) cluster (${cluster})`
  );
  const connection = connectionFor(cluster);
  const tokenData = await getTokenData(
    connection,
    new web3.PublicKey(mintId),
    true
  );
  if (
    !tokenData.certificateData &&
    !tokenData.tokenManagerData &&
    !tokenData.timeInvalidatorData &&
    !tokenData.useInvalidatorData
  ) {
    if (cluster !== "devnet") {
      console.log("Falling back to devnet metadata");
      return getMetadata(
        mintId,
        metadataUri,
        textParam,
        imgParam,
        attrs,
        "devnet"
      );
    } else if (tokenData.metaplexData?.data.data.symbol === "RCP") {
      return getExpiredMetadata(cluster);
    }
  }

  // get originalMint uri if present
  const originalMint = tokenData?.certificateData?.parsed
    .originalMint as web3.PublicKey;

  const dynamicAttributes: {
    display_type: string;
    value: string;
    trait_type: string;
  }[] = [];
  if (attrs) {
    try {
      const attributeGroups = attrs.split(";");
      for (let i = 0; i < attributeGroups.length; i++) {
        const attributeGroup = attributeGroups[i];
        try {
          const scopes = attributeGroup.split(".");
          if (scopes.length > 1) {
            // scoped fields
            const [address, accountType, fieldGroupParam] = scopes;
            const accountInfo = await connection.getAccountInfo(
              new web3.PublicKey(address)
            );
            const programId = accountInfo?.owner!;
            const IDL = (await import(
              `../idls/${programId.toString()}.json`
            )) as Idl;
            const coder = new BorshAccountsCoder(IDL);
            const scopeData = coder.decode(accountType, accountInfo?.data!);
            const fieldGroupStrings =
              fieldGroupParam === "*"
                ? Object.keys(scopeData)
                : fieldGroupParam.split(",");
            fieldGroupStrings.forEach((fieldGroupString) => {
              const fieldGroup = fieldGroupString.split(":");
              if (fieldGroup[1] in scopeData || fieldGroup[0] in scopeData) {
                dynamicAttributes.push({
                  display_type: fieldGroup[0],
                  value: scopeData[fieldGroup[1] ?? fieldGroup[0]].toString(),
                  trait_type: fieldGroup[2] ?? fieldGroup[1] ?? fieldGroup[0],
                });
              }
            });
          } else {
            // inline fields
            const fieldGroup = scopes[0].split(":");
            dynamicAttributes.push({
              display_type: fieldGroup[0],
              value: fieldGroup[1] ?? fieldGroup[0],
              trait_type: fieldGroup[2] ?? fieldGroup[1] ?? fieldGroup[0],
            });
          }
        } catch (e) {
          console.log("Failed to parse attribute: ", attributeGroup, e);
        }
      }
    } catch (e) {
      console.log("Failed to parse attributes", e);
    }
  }

  let originalTokenData: TokenData | null = null;
  if (originalMint) {
    try {
      originalTokenData = await getTokenData(connection, originalMint, true);
    } catch (e) {
      console.log(
        `Error fetching metaplex metadata for original mint (${originalMint.toString()})`,
        e
      );
    }
  }

  const fullName =
    originalTokenData?.metaplexData?.data.data.name ||
    tokenData?.metaplexData?.data.data.name ||
    textParam;
  const [namespace, _entryName] = namespaces.breakName(
    fullName || textParam || ""
  );
  console.log(tokenData);
  if (namespace === "twitter") {
    const owner = await getOwner(secondaryConnectionFor(cluster), mintId);
    return getTwitterMetadata(fullName, mintId, owner.toString(), cluster);
  }

  let response: NFTMetadata = {
    attributes: [],
  };
  if (originalTokenData?.metadata || metadataUri || tokenData.metadata) {
    let metadata =
      originalTokenData?.metadata?.data || tokenData.metadata?.data;
    if (!metadata) {
      try {
        metadata = await fetch(metadataUri, {}).then((r: Response) => r.json());
      } catch (e) {
        console.log("Failed to get metadata URI");
      }
    }

    if (metadata) {
      response = {
        ...response,
        ...metadata,
      };
    }

    if (
      (metadata &&
        (tokenData?.certificateData || tokenData.tokenManagerData)) ||
      imgParam ||
      textParam
    ) {
      response = {
        ...response,
        ...metadata,
        image: `https://nft.cardinal.so/img/${mintId}?uri=${
          metadata?.image || ""
        }${textParam ? `&text=${textParam}` : ""}${
          cluster ? `&cluster=${cluster}` : ""
        }`,
      };
    }
  }

  if (tokenData?.tokenManagerData?.parsed.state) {
    response = {
      ...response,
      attributes: [
        ...(response.attributes || []),
        {
          trait_type: "state",
          value:
            tokenData?.tokenManagerData?.parsed.state ===
            TokenManagerState.Invalidated
              ? "INVALIDATED"
              : "VALID",
          display_type: "State",
        },
      ],
    };
  }

  if (
    tokenData.tokenManagerData?.parsed.invalidationType ===
    InvalidationType.Return
  ) {
    response = {
      ...response,
      attributes: [
        ...(response.attributes || []),
        {
          trait_type: "type",
          value: "RENTAL",
          display_type: "Type",
        },
      ],
    };
  }

  if (tokenData.useInvalidatorData?.parsed.usages) {
    response = {
      ...response,
      attributes: [
        ...(response.attributes || []),
        {
          trait_type: "used",
          value: `(${tokenData.useInvalidatorData?.parsed.usages.toNumber()}${
            tokenData.useInvalidatorData?.parsed.maxUsages
              ? `/${tokenData.useInvalidatorData?.parsed.maxUsages.toNumber()}`
              : ""
          })`,
          display_type: "Used",
        },
      ],
    };
  }

  if (tokenData.timeInvalidatorData?.parsed.expiration) {
    response = {
      ...response,
      attributes: [
        ...(response.attributes || []),
        {
          trait_type: "expiration",
          value: `${tokenData.timeInvalidatorData?.parsed.expiration.toNumber()}`,
          display_type: "Expiration",
        },
      ],
    };
  }

  if (tokenData.timeInvalidatorData?.parsed?.durationSeconds) {
    response = {
      ...response,
      attributes: [
        ...(response.attributes || []),
        {
          trait_type: "duration",
          value: `${tokenData.timeInvalidatorData?.parsed?.durationSeconds.toNumber()}`,
          display_type: "Duration",
        },
      ],
    };
  }

  // collection
  if (tokenData?.metaplexData?.data.data.symbol === "$JAMB") {
    response = {
      ...response,
      collection: {
        name: "Jambomambo",
        family: "Jambomambo",
      },
      description:
        textParam === "TRAINING"
          ? "This Origin Jambo is out training in Jambo Camp!"
          : "This Origin Jambo is out hunting for loot around Jambo Camp!",
    };
  }

  // collection
  if (tokenData?.metaplexData?.data.data.symbol === "RCP") {
    response = {
      ...response,
      collection: {
        name: "Receipts",
        family: "Receipts",
      },
    };
  }

  if (dynamicAttributes) {
    response = {
      ...response,
      attributes: [...(response.attributes || []), ...dynamicAttributes],
    };
  }

  return response;
}
