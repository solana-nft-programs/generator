import {
  InvalidationType,
  TokenManagerState,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager";

import type { TokenData } from "../common/tokenData";

export const stateAttributes = (tokenData: TokenData) => {
  if (tokenData?.tokenManagerData?.parsed.state) {
    return [
      {
        trait_type: "state",
        value:
          tokenData?.tokenManagerData?.parsed.state ===
          TokenManagerState.Invalidated
            ? "INVALIDATED"
            : "VALID",
        display_type: "State",
      },
    ];
  }
  return [];
};

export const typeAttributes = (tokenData: TokenData) => {
  if (
    tokenData.tokenManagerData?.parsed.invalidationType ===
    InvalidationType.Return
  ) {
    return [
      {
        trait_type: "type",
        value: "Rental",
        display_type: "Type",
      },
    ];
  } else if (
    tokenData.tokenManagerData?.parsed.invalidationType ===
    InvalidationType.Release
  ) {
    return [
      {
        trait_type: "type",
        value: "Release",
        display_type: "Type",
      },
    ];
  }
  return [];
};

export const usageAttributes = (tokenData: TokenData) => {
  if (tokenData.useInvalidatorData?.parsed.usages) {
    return [
      {
        trait_type: "used",
        value: `(${tokenData.useInvalidatorData?.parsed.usages.toNumber()}${
          tokenData.useInvalidatorData?.parsed.maxUsages
            ? `/${tokenData.useInvalidatorData?.parsed.maxUsages.toNumber()}`
            : ""
        })`,
        display_type: "Used",
      },
    ];
  }
  return [];
};

export const expirationAttributes = (tokenData: TokenData) => {
  const expiration =
    tokenData.timeInvalidatorData?.parsed.maxExpiration ||
    tokenData.timeInvalidatorData?.parsed.expiration;
  if (expiration) {
    return [
      {
        trait_type: "expiration",
        value: `${expiration.toNumber()}`,
        display_type: "Expiration",
      },
    ];
  }
  return [];
};
export const durationAttributes = (tokenData: TokenData) => {
  const duration = tokenData.timeInvalidatorData?.parsed?.durationSeconds;
  if (duration) {
    return [
      {
        trait_type: "duration",
        value: `${duration.toNumber()}`,
        display_type: "Duration",
      },
    ];
  }
  return [];
};
