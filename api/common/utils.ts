import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";

import { identities } from "../img-generator/generator";

export const getOwner = async (connection: Connection, mintId: string) => {
  const mint = new PublicKey(mintId);
  const largestHolders = await connection.getTokenLargestAccounts(mint);
  const certificateMintToken = new Token(
    connection,
    mint,
    TOKEN_PROGRAM_ID,
    // not used
    Keypair.generate()
  );

  const largestTokenAccount =
    largestHolders?.value[0]?.address &&
    (await certificateMintToken.getAccountInfo(
      largestHolders?.value[0]?.address
    ));
  return largestTokenAccount.owner;
};

export function breakIdentity(fullName: string): [string, string] {
  if (fullName.startsWith("@")) {
    const namespace = fullName.split(":").at(-1) || "twitter";
    const entryName = fullName.includes(":")
      ? fullName.split("@")[1].split(":")[0]
      : fullName.split("@")[1];
    return [namespace, entryName];
  }
  const [entryName, namespace] = fullName.split(".");
  return [namespace, entryName];
}

export function formatName(namespace: string, name: string): string {
  return identities.includes(namespace) ? `@${name}` : `${name}.${namespace}`;
}
