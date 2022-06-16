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
import type { Connection } from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN } from "bn.js";

import { secondaryConnectionFor } from "../common/connection";
import type { MintClass } from "./mintClasses";
import { mintClasses } from "./mintClasses";

const authority = new SignerWallet(
  Keypair.fromSecretKey(utils.bytes.bs58.decode("CARDINAL_MINT_KEY"))
);

export async function mintToken(
  requestorAddress: string,
  mintClass: string,
  cluster = "devnet"
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

  // create master edition or edition start
  if (foundMintClass.editions) {
    await handleEdition(
      connection,
      transaction,
      mint.publicKey,
      requestor,
      authorityATA,
      foundMintClass
    );
  } else {
    await handleMasterEdition(
      connection,
      transaction,
      mint.publicKey,
      requestor,
      foundMintClass
    );
  }
  // create master edition or edition end

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
      invalidationType,
      1,
      requestor
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
      },
      requestor
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

export async function handleMasterEdition(
  connection: Connection,
  transaction: Transaction,
  mint: PublicKey,
  requestor: PublicKey,
  mintClass: MintClass
): Promise<void> {
  // create mint metadata start
  const masterEditionMetadataId = await metaplex.Metadata.getPDA(mint);
  const metadataTxs = new metaplex.CreateMetadataV2(
    { feePayer: requestor },
    {
      metadata: masterEditionMetadataId,
      metadataData: new metaplex.DataV2({
        name: mintClass.name,
        symbol: mintClass.symbol,
        uri: mintClass.uri || "",
        sellerFeeBasisPoints: 0,
        collection: null,
        uses: null,
        creators: mintClass.creators
          ? mintClass.creators
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
                  share: mintClass.creators.length === 0 ? 100 : 0,
                })
              )
          : null,
      }),
      updateAuthority: authority.publicKey,
      mint: mint,
      mintAuthority: authority.publicKey,
    }
  );
  // create mint metadata end

  const masterEditionId = await metaplex.MasterEdition.getPDA(mint);
  const masterEditionTx = new metaplex.CreateMasterEditionV3(
    {
      feePayer: requestor,
      recentBlockhash: (await connection.getRecentBlockhash("max")).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: authority.publicKey,
      mint: mint,
      mintAuthority: authority.publicKey,
      maxSupply: new BN(1),
    }
  );
  transaction.instructions = [
    ...metadataTxs.instructions,
    ...masterEditionTx.instructions,
  ];
}

export async function handleEdition(
  connection: Connection,
  transaction: Transaction,
  mint: PublicKey,
  requestor: PublicKey,
  authorityATA: PublicKey,
  mintClass: MintClass
): Promise<void> {
  if (!mintClass.editions) {
    throw new Error("Mint class does not configured for editions");
  }
  let masterEditionId: PublicKey;
  try {
    masterEditionId = new PublicKey(mintClass.editions.masterEdition);
  } catch (e) {
    throw new Error("Failed to parse master edition id");
  }
  const editionId = await metaplex.Edition.getPDA(mint);
  const masterEditionMetadataId = await metaplex.Metadata.getPDA(
    masterEditionId
  );
  const editionMetadataId = await metaplex.Metadata.getPDA(mint);
  const editionMarker = await metaplex.EditionMarker.getPDA(
    mint,
    new BN(0) // TODO
  );

  const editionTxs = new metaplex.MintNewEditionFromMasterEditionViaToken(
    {
      feePayer: requestor,
      recentBlockhash: (await connection.getRecentBlockhash("max")).blockhash,
    },
    {
      edition: editionId,
      metadata: editionMetadataId,
      updateAuthority: authority.publicKey,
      mint: mint,
      mintAuthority: authority.publicKey,
      masterEdition: masterEditionId,
      masterMetadata: masterEditionMetadataId,
      editionMarker: editionMarker,
      tokenOwner: authority.publicKey,
      tokenAccount: authorityATA,
      editionValue: new BN(0), // TODO
    }
  );
  transaction.instructions = [...editionTxs.instructions];
}
