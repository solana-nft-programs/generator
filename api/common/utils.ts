import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";

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
