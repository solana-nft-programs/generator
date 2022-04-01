# Cardinal Generator

[![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](https://github.com/cardinal-labs/cardinal-generator/blob/master/LICENSE)
[![Release](https://github.com/cardinal-labs/cardinal-generator/actions/workflows/release.yml/badge.svg?branch=v0.0.27)](https://github.com/cardinal-labs/cardinal-generator/actions/workflows/release.yml)

<p align="center">
    <img src="./images/banner.png" />
</p>

<p align="center">
    An open protocol for generative NFTs.
</p>

## Background

Cardinal generator encompasses serverless functions and smart contracts for rendering generative NFTs. The API defines a standard way to point to indicate pointers to any on-chain data that will be dynamically read and returned into the metadata of the NFT. In addition, there is an implementation of an on-chain mapping that fits this API spec to allow for more complex updating of this mapping. Cardinal generator works well with standard NFT collections and fits within the Metaplex NFT standard. It also composes with other programs in the Cardinal NFT infrastructure ecosystem.

## Packages

| Package                       | Description                              | Version                                                                                                                           | Docs                                                                                                             |
| :---------------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `cardinal-generator`         | Stake pool tracking total stake duration | [![Crates.io](https://img.shields.io/crates/v/cardinal-stake-pool)](https://crates.io/crates/cardinal-stake-pool)                 | [![Docs.rs](https://docs.rs/cardinal-stake-pool/badge.svg)](https://docs.rs/cardinal-stake-pool)                 |
| `@cardinal/generator`           | TypeScript SDK for generator               | [![npm](https://img.shields.io/npm/v/@cardinal/generator.svg)](https://www.npmjs.com/package/@cardinal/generator)                     | [![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://cardinal-labs.github.io/cardinal-generator/)     |

## Addresses

Program addresses are the same on devnet, testnet, and mainnet-beta.

- Generator: [`mdg7hsS3aWuWwSGVFTgC6KWpCaDJZ5qbEgWBQoGX4id`](https://explorer.solana.com/address/mdg7hsS3aWuWwSGVFTgC6KWpCaDJZ5qbEgWBQoGX4id)

## Documentation

> Generator is mainly an API that is designed to fit within the metaplex NFT standard, but bring the composability of on-chain data directly into the NFTs. This allows for more complex NFT use cases to compose directly with the attributes of the NFT while still maintaining compatibility with all wallet and marketplaces. Because this generator is dynamic, it means any time you view or load the NFT it will pull fresh on-chain data. Being serverless also means there is no dependency on infrastructure and scales horizontally. The long term vision of this project is to either adopt these practices within apps directly so they do not need to rely on the API, or run the API on a decentralized computing platform. For the time being, it serves to fit dynamic NFTs into the existing Solana NFT rails.

## Questions & Support

If you are developing using Cardinal generator contracts and libraries, feel free to reach out for support on Discord. We will work with you or your team to answer questions, provide development support and discuss new feature requests.

For issues please, file a GitHub issue.

> https://discord.gg/bz2SxDQ8

## License

Cardinal Protocol is licensed under the GNU Affero General Public License v3.0.

In short, this means that any changes to this code must be made open source and available under the AGPL-v3.0 license, even if only used privately.
