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

import { secondaryConnectionFor } from "../common/connection";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { getOwner } from "../common/utils";
import { getDefaultMetadata } from "./default";
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
  nameParam: string,
  uriParam: string,
  textParam: string,
  imgParam: string,
  eventParam: string,
  attrs: string,
  cluster: string
): Promise<NFTMetadata> {
  console.log(
    `Getting metadata for mintId (${mintId}) uri (${uriParam}) textParam (${textParam}) imgParam (${imgParam}) eventParam (${eventParam}) attrsParam (${attrs}) cluster (${cluster})`
  );
  const connection = secondaryConnectionFor(cluster);
  let tokenData: TokenData = {};
  try {
    tokenData = await getTokenData(
      connection,
      new web3.PublicKey(mintId),
      true
    );
  } catch (e) {
    console.log(e);
  }
  if (
    !tokenData.metaplexData &&
    !tokenData.certificateData &&
    !tokenData.tokenManagerData &&
    !tokenData.timeInvalidatorData &&
    !tokenData.useInvalidatorData
  ) {
    if (cluster !== "devnet") {
      console.log("Falling back to devnet metadata");
      return getMetadata(
        mintId,
        nameParam,
        uriParam,
        textParam,
        imgParam,
        eventParam,
        attrs,
        "devnet"
      );
    }
  }

  if (
    !tokenData.tokenManagerData &&
    tokenData.metaplexData?.parsed.data.symbol === "RCP"
  ) {
    return getExpiredMetadata(cluster);
  }

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
                  trait_type: fieldGroup[2] ?? fieldGroup[0],
                });
              }
            });
          } else {
            // inline fields
            const fieldGroup = scopes[0].split(":");
            dynamicAttributes.push({
              display_type: fieldGroup[0],
              value: fieldGroup[1] ?? fieldGroup[0],
              trait_type: fieldGroup[2] ?? fieldGroup[0],
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

  // ovverride uri with originalMint uri if present
  const originalMint = tokenData?.certificateData?.parsed
    .originalMint as web3.PublicKey;
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

  if (tokenData?.metaplexData?.parsed.data.symbol === "NAME") {
    const mintName =
      originalTokenData?.metaplexData?.parsed.data.name ||
      tokenData?.metaplexData?.parsed.data.name;
    const namespace = nameParam
      ? tokenData?.metaplexData?.parsed.data.name
      : namespaces.breakName(mintName || textParam || "")[0];

    if (namespace === "twitter") {
      const owner = await getOwner(secondaryConnectionFor(cluster), mintId);
      return getTwitterMetadata(
        nameParam ? `${nameParam}.${namespace}` : mintName,
        mintId,
        owner.toString(),
        nameParam,
        cluster
      );
    } else {
      const metadataUri = `https://events.cardinal.so/events/${namespace}/event.json`;
      try {
        const metadataResponse = await fetch(metadataUri, {});
        if (metadataResponse.status !== 200) {
          throw new Error("Metadata not found");
        }
        const metadata = await metadataResponse.json();
        return metadata as NFTMetadata;
      } catch (e) {
        return getDefaultMetadata(
          namespace,
          mintName,
          mintId,
          nameParam,
          cluster
        );
      }
    }
  }

  let response: NFTMetadata = {
    attributes: [],
  };
  const metadataUri = eventParam
    ? `https://events.cardinal.so/events/${eventParam}/event.json`
    : uriParam;
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
          nameParam ? `&name=${encodeURIComponent(nameParam)}` : ""
        }${cluster ? `&cluster=${cluster}` : ""}`,
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
  if (tokenData?.metaplexData?.parsed.data.symbol === "$JAMB") {
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
  if (tokenData?.metaplexData?.parsed.data.symbol === "RCP") {
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
