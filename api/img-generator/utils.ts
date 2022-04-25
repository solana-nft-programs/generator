import type * as anchor from "@project-serum/anchor";
import type * as splToken from "@solana/spl-token";
import BigNumber from "bignumber.js";

export function getMintDecimalAmount(
  mint: splToken.MintInfo,
  mintAmount: anchor.BN
) {
  return new BigNumber(mintAmount.toString()).shiftedBy(-mint.decimals);
}

export function fmtMintAmount(mint: splToken.MintInfo, mintAmount: anchor.BN) {
  return mint
    ? getMintDecimalAmount(mint, mintAmount).toFormat()
    : new BigNumber(mintAmount.toString()).toFormat();
}
