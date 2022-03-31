# Cardinal Staking

[![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](https://github.com/cardinal-labs/cardinal-staking/blob/master/LICENSE)
[![Release](https://github.com/cardinal-labs/cardinal-staking/actions/workflows/release.yml/badge.svg?branch=v0.0.27)](https://github.com/cardinal-labs/cardinal-staking/actions/workflows/release.yml)

<p align="center">
    <img src="./images/banner.png" />
</p>

<p align="center">
    An open protocol for staking NFTs and FTs.
</p>

## Background

Cardinal staking encompasses a suite of contracts for issuing and staking NFTs and FTs. The simple program is a stake pool that tracks total stake duration. In addition, there is an implementation of a token minting reward distributor. Cardinal staking works well with any standard NFT collection and also composes with other programs in the Cardinal NFT infrastructure ecosystem.

## Packages

| Package                       | Description                              | Version                                                                                                                           | Docs                                                                                                             |
| :---------------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `cardinal-stake-pool`         | Stake pool tracking total stake duration | [![Crates.io](https://img.shields.io/crates/v/cardinal-stake-pool)](https://crates.io/crates/cardinal-stake-pool)                 | [![Docs.rs](https://docs.rs/cardinal-stake-pool/badge.svg)](https://docs.rs/cardinal-stake-pool)                 |
| `cardinal-reward-distributor` | Simple token minting rewards distributor | [![Crates.io](https://img.shields.io/crates/v/cardinal-reward-distributor)](https://crates.io/crates/cardinal-reward-distributor) | [![Docs.rs](https://docs.rs/cardinal-reward-distributor/badge.svg)](https://docs.rs/cardinal-reward-distributor) |
| `@cardinal/staking`           | TypeScript SDK for staking               | [![npm](https://img.shields.io/npm/v/@cardinal/staking.svg)](https://www.npmjs.com/package/@cardinal/staking)                     | [![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://cardinal-labs.github.io/cardinal-staking/)     |

## Addresses

Program addresses are the same on devnet, testnet, and mainnet-beta.

- StakePool: [`stkBL96RZkjY5ine4TvPihGqW8UHJfch2cokjAPzV8i`](https://explorer.solana.com/address/stkBL96RZkjY5ine4TvPihGqW8UHJfch2cokjAPzV8i)
- RewardDistributor: [`rwdNPNPS6zNvtF6FMvaxPRjzu2eC51mXaDT9rmWsojp`](https://explorer.solana.com/address/rwdNPNPS6zNvtF6FMvaxPRjzu2eC51mXaDT9rmWsojp)

## Plugins

Cardinal stake pool is meant to be composable. A simple reward distributor is provided out of the box, but any complex reward distribution logic can be implemented in a similar manner. Other implementations of other reward distributors are welcomed and encouraged. Examples that could be built:

- Tiered reward system that distributes rewards based on specified stake tiers
- Arbitrary non-linear reward functions
- NFT mutator that modifies metadata based on stake duration
- Probabilistic distributor that may or may not give a reward depending on the outcome of a random iteration. This could apply to a quest or mission with a given probability of success

## Documentation

**Stake Type**

> Stake pool is designed to support 2 types of staking: 'Locked' and 'Escrow'

- `StakeType::Locked`

  - When staking using the "locked" stake type, at initiation of the stake, the token(s) will be locked into the staker's wallet, and the stake timer will begin.
  - This allows users to continue holding their tokens while they're staked which can be advantageous for several reasons including allowing them to continue participating in DAOs and gated discord servers.
  - While it does sit in their wallet, the token is frozen while it is staked and thus cannot be traded/sent to anyone else. The locked aspect of staking that projects hope to achieve is thus not compromised in any way.
  - In order to unstake, this locked token must first be unfrozen and returned to the stake pool. The current implementation leverages the Cardinal Token Manager and the invalidation type of "Return". The way this works is that upon staking, the token is issued back to the staker from the stake pool with an associated Token Manager wrapper. Then, when the user decides to unstake, the token manager is invalidated, and the token is programatically returned back to the pool. Now back in the pool and unwrapped, the token can be freely claimed by user. The client abstracts this invalidation and return inside of the unstake api.

- `StakeType::Escrow`
  - When staking using the "escrow" stake type, the token(s) will be transferred into a token account owned by the stake entry, and wallet address of the most recent staker is recorded.
  - The current staker can unstake at any time which increments the stake timer for that mint.

**Receipts**

> Receipts is a feature most useful for StakeType::Escrow that allows any staker to claim a receipt NFT representing their current stake.

- Receipt metadata is dynamic by default and uses the Cardinal metadata and img-generators hosted at https://api.cardinal.so/metadata and https://api.cardinal.so/img respectively.
- Using a receipt combined with StakeType::Escrow allows the user to maintain a record in their wallet of their stake even when the token is in escrow. This approach is additionally beneficial because the receipt can be clearly identified in the wallet as a staked NFT rather than a just locked one because of the mutable and dynamic nature of its metadata that allows for relevant markers/metrics to be displayed.
- Receipts are not nearly as useful when using StakeType::Locked because the original token remains in the user's wallet.
- Any unstaking requires returning the receipt before the unstake instruction can be called. This can be done via the Cardinal Token Manager with 'InvalidationType::Return'. Similar to how returning locked tokens works, this will is handled automatically by the client unstake api.

## Questions & Support

If you are developing using Cardinal staking contracts and libraries, feel free to reach out for support on Discord. We will work with you or your team to answer questions, provide development support and discuss new feature requests.

For issues please, file a GitHub issue.

> https://discord.gg/bz2SxDQ8

## License

Cardinal Protocol is licensed under the GNU Affero General Public License v3.0.

In short, this means that any changes to this code must be made open source and available under the AGPL-v3.0 license, even if only used privately.
