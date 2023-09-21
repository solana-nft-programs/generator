export type SolanaNftProgramsGenerator = {
  version: "0.1.0";
  name: "solana_nft_programs_generator";
  instructions: [
    {
      name: "createMetadataConfig";
      accounts: [
        {
          name: "metadataConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mintMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "CreateMetadataConfigIx";
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "metadataConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "baseMetadataUri";
            type: "string";
          },
          {
            name: "attributes";
            type: {
              vec: {
                defined: "Attribute";
              };
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "CreateMetadataConfigIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "seedString";
            type: "string";
          },
          {
            name: "attributes";
            type: {
              vec: {
                defined: "Attribute";
              };
            };
          }
        ];
      };
    },
    {
      name: "Attribute";
      type: {
        kind: "struct";
        fields: [
          {
            name: "address";
            type: "publicKey";
          },
          {
            name: "accountType";
            type: "string";
          },
          {
            name: "fields";
            type: {
              vec: "string";
            };
          }
        ];
      };
    }
  ];
};

export const IDL: SolanaNftProgramsGenerator = {
  version: "0.1.0",
  name: "solana_nft_programs_generator",
  instructions: [
    {
      name: "createMetadataConfig",
      accounts: [
        {
          name: "metadataConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mintMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "CreateMetadataConfigIx",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "metadataConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "baseMetadataUri",
            type: "string",
          },
          {
            name: "attributes",
            type: {
              vec: {
                defined: "Attribute",
              },
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "CreateMetadataConfigIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "seedString",
            type: "string",
          },
          {
            name: "attributes",
            type: {
              vec: {
                defined: "Attribute",
              },
            },
          },
        ],
      },
    },
    {
      name: "Attribute",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "publicKey",
          },
          {
            name: "accountType",
            type: "string",
          },
          {
            name: "fields",
            type: {
              vec: "string",
            },
          },
        ],
      },
    },
  ],
};
