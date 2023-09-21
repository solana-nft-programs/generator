/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-assignment*/
import * as namespaces from "@solana-nft-programs/namespaces";
import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import fetch from "node-fetch";

import { secondaryConnectionFor } from "../common/connection";
import { tryGetEvent, tryGetEventTicket } from "../common/firebase";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { getOwner } from "../common/utils";
import { getTicketImageURL } from "../img-generator/event-ticket-image";
import {
  durationAttributes,
  expirationAttributes,
  stateAttributes,
  typeAttributes,
  usageAttributes,
} from "./attributes";
import { getDefaultMetadata } from "./default";
import { getTicketMetadataLink } from "./event-ticket-metadata";
import { getExpiredMetadata } from "./expired";
import { getDefaultTicketMetadata } from "./ticket";
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

  if (
    (tokenData?.metaplexData?.parsed.data.symbol === "NAME" ||
      tokenData?.metaplexData?.parsed.data.symbol === "TICKET" ||
      tokenData?.metaplexData?.parsed.data.symbol === "TIX") &&
    (tokenData?.metaplexData?.parsed.data.name.startsWith("crd-") ||
      nameParam.startsWith("crd-"))
  ) {
    const metadataUri = getTicketMetadataLink(
      tokenData?.metaplexData?.parsed.data.name
    );
    const imageUri = getTicketImageURL(
      tokenData?.metaplexData?.parsed.data.name
    );
    try {
      const metadataResponse = await fetch(metadataUri, {});
      if (metadataResponse.status !== 200) {
        throw new Error("Metadata not found");
      }
      const metadata = (await metadataResponse.json()) as NFTMetadata;

      const ticketid = tokenData?.metaplexData?.parsed.data.name;
      const ticketData = await tryGetEventTicket(ticketid);
      if (ticketData) {
        const eventId = ticketData.eventId;
        const eventData = await tryGetEvent(eventId);
        metadata.collection = {
          name: eventData?.name,
          family: eventData?.name,
        };

        metadata.attributes = [
          ...(metadata.attributes || []),
          ...typeAttributes(tokenData),
          ...usageAttributes(tokenData),
          ...expirationAttributes(tokenData),
          {
            trait_type: "verified",
            value:
              tokenData?.metaplexData.parsed.data.creators?.find(
                (c) => c.verified
              )?.address === ticketData.ticketSignerAddress
                ? "True"
                : "False",
            display_type: "Verified",
          },
        ];

        if (eventData) {
          const verifyUrl = `https://events.host.so/default/${eventData?.shortLink}/verify`;
          metadata.external_url = `https://phantom.app/ul/browse/${encodeURIComponent(
            verifyUrl
          )}`;
        }
      }
      return { ...metadata, image: imageUri };
    } catch (e) {
      return getDefaultTicketMetadata(mintId, cluster, [
        ...typeAttributes(tokenData),
        ...usageAttributes(tokenData),
        ...expirationAttributes(tokenData),
      ]);
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
      const metadataUri = `https://events.host.so/events/${namespace}/event.json`;
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
    ? `https://events.host.so/events/${eventParam}/event.json`
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
        image: `https://nft.host.so/img/${mintId}?uri=${
          metadata?.image || ""
        }${textParam ? `&text=${textParam}` : ""}${
          nameParam ? `&name=${encodeURIComponent(nameParam)}` : ""
        }${cluster ? `&cluster=${cluster}` : ""}`,
      };
    }
  }

  response = {
    ...response,
    attributes: [
      ...(response.attributes || []),
      ...stateAttributes(tokenData),
      ...typeAttributes(tokenData),
      ...usageAttributes(tokenData),
      ...expirationAttributes(tokenData),
      ...durationAttributes(tokenData),
    ],
  };

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

  if (imgParam) {
    response = {
      ...response,
      image: imgParam,
    };
  }

  if (nameParam) {
    response = {
      ...response,
      name: nameParam,
    };
  }

  return response;
}
