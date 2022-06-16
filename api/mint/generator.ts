import { init as timeInit } from "@cardinal/token-manager/dist/cjs/programs/timeInvalidator/instruction";
import {
  InvalidationType,
  TokenManagerKind,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import {
  addInvalidator,
  claim,
  init as tmInit,
  issue,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager/instruction";
import { findTokenManagerAddress } from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { MintLayout, SPLToken } from "@saberhq/token-utils";
import * as splToken from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN } from "bn.js";

import { secondaryConnectionFor } from "../common/connection";
import { mintClasses } from "./mintClasses";

const authority = new SignerWallet(
  Keypair.fromSecretKey(utils.bytes.bs58.decode("CARDINAL_MINT_KEY"))
);

export async function mintToken(
  requestorAddress: string,
  mintClass: string,
  cluster: string
): Promise<string> {
  console.log(
    ` (Creating mitn transaction for class ${mintClass} cluster (${cluster})`
  );
  if (!requestorAddress) {
    throw new Error("Failed to get requestor to mint token");
  }
  let requestor: PublicKey;
  try {
    requestor = new PublicKey(requestorAddress);
  } catch (e) {
    throw new Error("Failed to parse requestor address");
  }
  const connection = secondaryConnectionFor(cluster);
  let transaction = new Transaction();

  // fetch class start
  if (!mintClass) {
    throw new Error("Mint class param not found in url");
  }
  const foundMintClass = mintClasses.find((c) => c.name === mintClass);
  if (!foundMintClass) {
    throw new Error("Mint class not found from mint classes list");
  }
  // fetch class end

  // create mint start
  const mint = Keypair.generate();
  const instructions = [
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      programId: splToken.TOKEN_PROGRAM_ID,
    }),
    SPLToken.createInitMintInstruction(
      splToken.TOKEN_PROGRAM_ID,
      mint.publicKey,
      0,
      authority.publicKey,
      authority.publicKey
    ),
  ];
  transaction.instructions = [...instructions];
  // create mint end

  // create ATAs start
  const authorityATA = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint.publicKey,
    authority.publicKey,
    true
  );
  const authorityATAInstruction =
    splToken.Token.createAssociatedTokenAccountInstruction(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mint.publicKey,
      authorityATA,
      authority.publicKey,
      requestor
    );

  const requestorATA = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint.publicKey,
    requestor,
    true
  );
  const requestorATAInstruction =
    splToken.Token.createAssociatedTokenAccountInstruction(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mint.publicKey,
      requestorATA,
      requestor,
      requestor
    );
  transaction.instructions = [
    ...[authorityATAInstruction, requestorATAInstruction],
  ];
  // create ATAs end

  // create mint metadata start
  const masterEditionMetadataId = await metaplex.Metadata.getPDA(
    mint.publicKey
  );
  const metadataIxs = new metaplex.CreateMetadataV2(
    { feePayer: requestor },
    {
      metadata: masterEditionMetadataId,
      metadataData: new metaplex.DataV2({
        name: foundMintClass.name,
        symbol: foundMintClass.symbol,
        uri: foundMintClass.uri || "",
        sellerFeeBasisPoints: 0,
        collection: null,
        uses: null,
        creators: foundMintClass.creators
          ? foundMintClass.creators
              .map(
                (c) =>
                  new metaplex.Creator({
                    address: c.pubkey,
                    verified: false,
                    share: c.share,
                  })
              )
              .concat(
                new metaplex.Creator({
                  address: authority.publicKey.toString(),
                  verified: false,
                  share: foundMintClass.creators.length === 0 ? 100 : 0,
                })
              )
          : null,
      }),
      updateAuthority: authority.publicKey,
      mint: mint.publicKey,
      mintAuthority: authority.publicKey,
    }
  );

  const masterEditionId = await metaplex.MasterEdition.getPDA(mint.publicKey);
  const masterEditionTx = new metaplex.CreateMasterEditionV3(
    {
      feePayer: requestor,
      recentBlockhash: (await connection.getRecentBlockhash("max")).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: authority.publicKey,
      mint: mint.publicKey,
      mintAuthority: authority.publicKey,
      maxSupply: new BN(1),
    }
  );
  transaction.instructions = [
    ...metadataIxs.instructions,
    ...masterEditionTx.instructions,
  ];
  // create mint metadata end

  if (foundMintClass.tokenManger) {
    // create token manager ATA start
    const [tokenManagerId] = await findTokenManagerAddress(mint.publicKey);
    const tmATA = await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mint.publicKey,
      tokenManagerId,
      true
    );
    const tmATAInstruction =
      splToken.Token.createAssociatedTokenAccountInstruction(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        mint.publicKey,
        tmATA,
        authority.publicKey,
        requestor
      );
    transaction.instructions = [...[tmATAInstruction]];
    // create token manager ATA end

    // init token manager start
    let invalidationType = InvalidationType.Release;
    if (
      foundMintClass.tokenManger &&
      foundMintClass.tokenManger.type === "return"
    ) {
      invalidationType = InvalidationType.Return;
    }
    const [tokenManagerInitInstruction] = await tmInit(
      connection,
      authority,
      mint.publicKey,
      authorityATA,
      new BN(1),
      TokenManagerKind.Edition,
      invalidationType
    );
    transaction.instructions = [...[tokenManagerInitInstruction]];
    // init token manager end

    // init time invalidator start
    const [timeInstruction, timeInvalidatorId] = await timeInit(
      connection,
      authority,
      tokenManagerId,
      {
        durationSeconds: foundMintClass.tokenManger?.timeLockSeconds,
      }
    );
    transaction.instructions = [...[timeInstruction]];
    // init time invalidator end

    // add invalidator start
    addInvalidator(connection, authority, tokenManagerId, timeInvalidatorId);
    // add invalidator end

    // issue token manager start
    const issueInstruction = issue(
      connection,
      authority,
      tokenManagerId,
      tmATA,
      authorityATA
    );
    transaction.instructions = [...[issueInstruction]];
    // issue token manager end

    // claim token manager start
    const tmClaimInstruction = await claim(
      connection,
      authority,
      tokenManagerId,
      TokenManagerKind.Edition,
      mint.publicKey,
      tmATA,
      requestorATA,
      undefined
    );
    // claim token manager end
    transaction.instructions = [...[tmClaimInstruction]];
  }

  transaction = Transaction.from(
    transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    })
  );
  // Serialize and return the unsigned transaction.
  const serialized = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  });
  const base64 = serialized.toString("base64");

  return base64;
}
