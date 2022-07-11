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

| Package               | Description                                                  | Version                                                                                                           | Docs                                                                                                           |
| :-------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `cardinal-generator`  | Solana program for mapping a mint to any on-chain attributes | [![Crates.io](https://img.shields.io/crates/v/cardinal-stake-pool)](https://crates.io/crates/cardinal-stake-pool) | [![Docs.rs](https://docs.rs/cardinal-stake-pool/badge.svg)](https://docs.rs/cardinal-stake-pool)               |
| `@cardinal/generator` | TypeScript SDK for generator                                 | [![npm](https://img.shields.io/npm/v/@cardinal/generator.svg)](https://www.npmjs.com/package/@cardinal/generator) | [![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://cardinal-labs.github.io/cardinal-generator/) |

## Addresses

Program addresses are the same on devnet, testnet, and mainnet-beta.

- Generator: [`genSsTXZaAGH1kRUe74TXzwuernqZhJksHvpXiAxBQT`](https://explorer.solana.com/address/genSsTXZaAGH1kRUe74TXzwuernqZhJksHvpXiAxBQT)

## Documentation

Generator is mainly an API that is designed to fit within the metaplex NFT standard, but bring the composability of on-chain data directly into the NFTs. This allows for more complex NFT use cases to compose directly with the attributes of the NFT while still maintaining compatibility with all wallet and marketplaces. Because this generator is dynamic, it means any time you view or load the NFT it will pull fresh on-chain data. Being serverless also means there is no dependency on infrastructure and scales horizontally. The long term vision of this project is to either adopt these practices within apps directly so they do not need to rely on the API, or run the API on a decentralized computing platform. For the time being, it serves to fit dynamic NFTs into the existing Solana NFT rails.

## Dynamic Attributes

Dynamic attributes have a separate parameters that allows for generic setting of any attributes on the NFT based on other on-chain data

- uri
  - The uri field to provide the existing base metadata
- attrs

  - attrs= is a list of "attribute group" objects separates by `;` semi-colons
  - Each "attribute group" can contain optional scopes, denoted with `.` and then contains one or more "field groups"
  - If scoped, the scopes should precede the field group and be in the format of `{address}.{accountName}.` where address is the account address and accountName is the name of this account to deserialize into. This account will be queried from on-chain and deserialized using the given accountName and the IDL for the owning program
  - Following the scopes, will be "field groups", where each field group can contain `key:value:display_type` separated by `:`. Each piece is optional. If scoped, the value will be looked up in the corresponding account by name. If not scoped, the value will be used as a string value.
  - Attributes come in the form with the following fallback logic allowing for 1, 2 or 3 fields specified in the field group

  ```
  const fieldGroup = fieldGroupString.split(":")
  const attribute = {
    "display_type": fieldGroup[0],
    value: scopeData
      ? scopeData[fieldGroup[1] ?? fieldGroup[0]].toString()
      : fieldGroup[1] ?? fieldGroup[0],
    trait_type: fieldGroup[2] ?? fieldGroup[0],
  }
  ```

This is a summary of logic in the metadata-generator handler

Example getting “stakeBoost” from this staked NFT
https://nft.cardinal.so/metadata/9Pt7GiyL5N4Zc2cEcLd112GpZhCD9KWxnYE4h9DmRpDo?uri=https://arweave.net/BpIxD8LTr4934uk237kdc4QvCD_PWrY-51Dayh7h5V0&attrs=9kRs4BPUqYh3Vk1v1J8WE694afGFjfi4QeF3AfVUbfMn.StakeEntry.stakeBoost

Example getting “stakeBoost” from this staked NFT and naming it Boost
https://nft.cardinal.so/metadata/9Pt7GiyL5N4Zc2cEcLd112GpZhCD9KWxnYE4h9DmRpDo?uri=https://arweave.net/BpIxD8LTr4934uk237kdc4QvCD_PWrY-51Dayh7h5V0&attrs=9kRs4BPUqYh3Vk1v1J8WE694afGFjfi4QeF3AfVUbfMn.StakeEntry.Boost:stakeBoost

Example getting all fields from this staked NFT account
[https://nft.cardinal.so/metadata/9Pt7GiyL5N4Zc2cEcLd112GpZhCD9KWxnYE4h9DmRpDo?uri=https://arweave.net/BpIxD8LTr4934uk237kdc4QvCD_PWrY-51Dayh7h5V0&attrs=9kRs4BPUqYh3Vk1v1J8WE694afGFjfi4QeF3AfVUbfMn.StakeEntry.\*](https://nft.cardinal.so/metadata/9Pt7GiyL5N4Zc2cEcLd112GpZhCD9KWxnYE4h9DmRpDo?uri=https://arweave.net/BpIxD8LTr4934uk237kdc4QvCD_PWrY-51Dayh7h5V0&attrs=9kRs4BPUqYh3Vk1v1J8WE694afGFjfi4QeF3AfVUbfMn.StakeEntry.*)

Example getting multiple fields from this staked NFT account
https://nft.cardinal.so/metadata/9Pt7GiyL5N4Zc2cEcLd112GpZhCD9KWxnYE4h9DmRpDo?uri=https://arweave.net/BpIxD8LTr4934uk237kdc4QvCD_PWrY-51Dayh7h5V0&attrs=9kRs4BPUqYh3Vk1v1J8WE694afGFjfi4QeF3AfVUbfMn.StakeEntry.Boost:stakeBoost,Seconds%20staked:totalStakeSeconds

## Overlay Text

Text param is used to overaly specific text on the base image. The test param supports bare text and has a concept of "styles" to style the text in various ways

Styles

- None
  - Basic white test
  - e.g. https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=none:TEXT

<div style="text-align: center; width: 100%;">
  <img style="height: 250px" src="https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=none:TEXT" />
</div>

- Overlay
  - Overlay text centered over the image with a partially transparent background and border
  - e.g. https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=overlay:TEXT

<div style="text-align: center; width: 100%;">
  <img style="height: 250px" src="https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=overlay:TEXT" />
</div>

- Header
  - Header text at the top of the image
  - e.g https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=header:HEADER

<div style="text-align: center; width: 100%;">
  <img style="height: 250px" src="https://nft.cardinal.so/img/D4vFpxAi9JFC5KaFyM3R92BbxP1Fu1daKSay53Uo9cgF?uri=https://arweave.net/QPsEEJ-YpRjF35LzHWGhuknJ0tdN7n0ehjxpvpwFYmE?ext=jpg&text=header:HEADER" />
</div>

## Questions & Support

If you are developing using Cardinal generator contracts and libraries, feel free to reach out for support on Discord. We will work with you or your team to answer questions, provide development support and discuss new feature requests.

For issues please, file a GitHub issue.

> https://discord.gg/hBWw5pwXUq

## License

Cardinal generators is licensed under the GNU Affero General Public License v3.0.

In short, this means that any changes to this code must be made open source and available under the AGPL-v3.0 license, even if only used privately.
