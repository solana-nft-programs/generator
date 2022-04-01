import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import { Keypair, Transaction } from "@solana/web3.js";
import { expect } from "chai";

import { getMetadataConfig } from "../src/programs/metadataGenerator/accounts";
import { findMetadatConfigId } from "../src/programs/metadataGenerator/pda";
import { withCreateMetadataConfig } from "../src/transaction";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create metadata config", () => {
  let mint: splToken.Token;
  const configName = "test-config";
  const mintAuthority = Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [, mint] = await createMint(
      provider.connection,
      mintAuthority,
      provider.wallet.publicKey,
      1,
      mintAuthority.publicKey
    );

    // master edition
    const ixs = await createMasterEditionIxs(
      mint.publicKey,
      mintAuthority.publicKey
    );
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(mintAuthority),
        opts: provider.opts,
      }),
      ixs
    );
    await expectTXTable(txEnvelope, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;
  });

  it("Create metadata config", async () => {
    const provider = getProvider();
    let transaction = new Transaction();
    transaction = await withCreateMetadataConfig(
      provider.connection,
      provider.wallet,
      mint.publicKey,
      configName,
      []
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create metadata config"
    ).to.be.fulfilled;

    const [metadataConfigId] = await findMetadatConfigId(configName);
    const metadataConfigData = await getMetadataConfig(
      provider.connection,
      metadataConfigId
    );

    expect(metadataConfigData.parsed).to.not.eq(null);
  });
});
