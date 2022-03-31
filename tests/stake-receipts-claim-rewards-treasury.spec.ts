import { findAta } from "@cardinal/common";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";

import {
  claimReceiptMint,
  initStakePool,
  rewardDistributor,
  stake,
  unstake,
} from "../src";
import { RewardDistributorKind } from "../src/programs/metadataGenerator";
import { getRewardDistributor } from "../src/programs/metadataGenerator/accounts";
import { findRewardDistributorId } from "../src/programs/metadataGenerator/pda";
import { StakeType } from "../src/programs/stakePool";
import {
  getStakeEntry,
  getStakePool,
} from "../src/programs/stakePool/accounts";
import {
  findStakeEntryId,
  findStakePoolId,
} from "../src/programs/stakePool/pda";
import { createMasterEditionIxs, createMint, delay } from "./utils";
import { getProvider } from "./workspace";

describe("Stake and claim rewards from treasury", () => {
  const maxSupply = 100;
  let poolIdentifier: BN;
  let stakePoolId: web3.PublicKey;
  let originalMintTokenAccountId: web3.PublicKey;
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;
  let receiptMintKeypair: web3.Keypair | undefined;
  const originalMintAuthority = web3.Keypair.generate();
  const receiptMintName = "NAME";
  const receiptMintSymbol = "SYMBOL";

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      1,
      originalMintAuthority.publicKey
    );

    // master edition
    const ixs = await createMasterEditionIxs(
      originalMint.publicKey,
      originalMintAuthority.publicKey
    );
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(originalMintAuthority),
        opts: provider.opts,
      }),
      ixs
    );
    await expectTXTable(txEnvelope, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    // reward mint
    [, rewardMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      maxSupply,
      provider.wallet.publicKey
    );
  });

  it("Create Pool", async () => {
    const provider = getProvider();
    let transaction = new web3.Transaction();
    [transaction, , poolIdentifier] = await initStakePool(
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

  it("Create Reward Distributor", async () => {
    const provider = getProvider();
    const transaction = new web3.Transaction();
    await rewardDistributor.transaction.withInitRewardDistributor(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: rewardMint.publicKey,
        kind: RewardDistributorKind.Treasury,
        maxSupply: new BN(maxSupply),
      }
    );

    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: provider.wallet,
        opts: provider.opts,
      }),
      [...transaction.instructions]
    );

    await expectTXTable(txEnvelope, "Create reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );
  });

  it("Init Reward Entry", async () => {
    const provider = getProvider();
    const transaction = new web3.Transaction();
    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    await rewardDistributor.transaction.withInitRewardEntry(
      transaction,
      provider.connection,
      provider.wallet,
      {
        mintId: originalMint.publicKey,
        rewardDistributorId: rewardDistributorId,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Init reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
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
        [...transaction.instructions],
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
      throw new Error("Receipt mint keypair is undefined");
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
    await delay(2000);
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

    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      web3.PublicKey.default.toString()
    );
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(0);

    if (receiptMintKeypair) {
      const checkMint = new splToken.Token(
        provider.connection,
        receiptMintKeypair.publicKey,
        splToken.TOKEN_PROGRAM_ID,
        web3.Keypair.generate()
      );

      const userOriginalMintTokenAccountId = await findAta(
        originalMint.publicKey,
        provider.wallet.publicKey,
        true
      );

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

      const userRewardMintTokenAccountId = await findAta(
        rewardMint.publicKey,
        provider.wallet.publicKey,
        true
      );

      const checkUserReceiptMintTokenAccount = await checkMint.getAccountInfo(
        userReceiptMintTokenAccountId
      );
      expect(checkUserReceiptMintTokenAccount.amount.toNumber()).to.eq(0);

      const checkStakeEntryReceiptMintTokenAccount =
        await checkMint.getAccountInfo(stakeEntryReceiptMintTokenAccountId);
      expect(checkStakeEntryReceiptMintTokenAccount.amount.toNumber()).to.eq(1);

      const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
        userOriginalMintTokenAccountId
      );
      expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);

      const checkStakeEntryOriginalMintTokenAccount =
        await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
      expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(
        0
      );

      const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
        userRewardMintTokenAccountId
      );
      expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);
    } else {
      throw new Error("Receipt mint keypair is undefined");
    }
  });
});
