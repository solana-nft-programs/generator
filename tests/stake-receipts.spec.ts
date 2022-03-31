import { findAta } from "@cardinal/common";
import type { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";

import { claimReceiptMint, stake, unstake } from "../src";
import { StakeType } from "../src/programs/stakePool";
import {
  getStakeEntry,
  getStakePool,
} from "../src/programs/stakePool/accounts";
import {
  findStakeEntryId,
  findStakePoolId,
} from "../src/programs/stakePool/pda";
import { withInitStakePool } from "../src/programs/stakePool/transaction";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let poolIdentifier: BN;
  let stakePoolId: web3.PublicKey;
  let originalMintTokenAccountId: web3.PublicKey;
  let originalMint: splToken.Token;
  const receiptMintName = "NAME";
  const receiptMintSymbol = "SYMBOL";
  let receiptMintKeypair: web3.Keypair | undefined;
  const originalMintAuthority = web3.Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey
    );
  });

  it("Create Pool", async () => {
    const provider = getProvider();
    const transaction = new web3.Transaction();

    [, , poolIdentifier] = await withInitStakePool(
      transaction,
      provider.connection,
      provider.wallet,
      {}
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create pool"
    ).to.be.fulfilled;

    [stakePoolId] = await findStakePoolId(poolIdentifier);
    const stakePoolData = await getStakePool(provider.connection, stakePoolId);

    expect(stakePoolData.parsed.identifier.toNumber()).to.eq(
      poolIdentifier.toNumber()
    );
  });

  it("Stake", async () => {
    const provider = getProvider();
    let transaction: web3.Transaction;

    [transaction, receiptMintKeypair] = await stake(
      provider.connection,
      provider.wallet,
      {
        stakeType: StakeType.Escrow,
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
        userOriginalMintTokenAccountId: originalMintTokenAccountId,
        receipt: {
          name: receiptMintName,
          symbol: receiptMintSymbol,
        },
      }
    );

    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions,
        receiptMintKeypair ? [receiptMintKeypair] : []
      ),
      "Stake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryId(stakePoolId, originalMint.publicKey)
      )[0]
    );

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    if (!receiptMintKeypair) {
      throw new Error("Receipt mint keypair is null");
    }

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
      true
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );

    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(0);

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(1);
  });

  it("Claim receipt mint", async () => {
    const provider = getProvider();

    if (!receiptMintKeypair) {
      throw new Error("Receipt mint keypair is null");
    }

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await claimReceiptMint(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
            receiptMintId: receiptMintKeypair?.publicKey,
          })
        ).instructions,
      ]),
      "Claim receipt mint"
    ).to.be.fulfilled;

    const userReceiptMintTokenAccountId = await findAta(
      receiptMintKeypair.publicKey,
      provider.wallet.publicKey,
      true
    );

    const [stakeEntryId] = await findStakeEntryId(
      stakePoolId,
      originalMint.publicKey
    );
    const stakeEntryReceiptMintTokenAccountId = await findAta(
      receiptMintKeypair.publicKey,
      stakeEntryId,
      true
    );

    const receiptMint = new splToken.Token(
      provider.connection,
      receiptMintKeypair.publicKey,
      splToken.TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    );

    const checkUserReceiptMintTokenAccount = await receiptMint.getAccountInfo(
      userReceiptMintTokenAccountId
    );
    expect(checkUserReceiptMintTokenAccount.amount.toNumber()).to.eq(1);

    const checkStakeEntryReceiptMintTokenAccount =
      await receiptMint.getAccountInfo(stakeEntryReceiptMintTokenAccountId);
    expect(checkStakeEntryReceiptMintTokenAccount.amount.toNumber()).to.eq(0);
  });

  it("Unstake", async () => {
    const provider = getProvider();
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await unstake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
          })
        ).instructions,
      ]),
      "Unstake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryId(stakePoolId, originalMint.publicKey)
      )[0]
    );

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    if (!receiptMintKeypair) {
      throw new Error("Receipt mint keypair is null");
    }

    const userReceiptMintTokenAccountId = await findAta(
      receiptMintKeypair.publicKey,
      provider.wallet.publicKey,
      true
    );

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
      true
    );

    const stakeEntryReceiptMintTokenAccountId = await findAta(
      receiptMintKeypair.publicKey,
      stakeEntryData.pubkey,
      true
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      web3.PublicKey.default.toString()
    );

    const receiptMint = new splToken.Token(
      provider.connection,
      receiptMintKeypair.publicKey,
      splToken.TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    );

    const checkUserReceiptMintTokenAccount = await receiptMint.getAccountInfo(
      userReceiptMintTokenAccountId
    );
    expect(checkUserReceiptMintTokenAccount.amount.toNumber()).to.eq(0);

    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(0);

    const checkStakeEntryReceiptMintTokenAccount =
      await receiptMint.getAccountInfo(stakeEntryReceiptMintTokenAccountId);
    expect(checkStakeEntryReceiptMintTokenAccount.amount.toNumber()).to.eq(1);
  });
});
