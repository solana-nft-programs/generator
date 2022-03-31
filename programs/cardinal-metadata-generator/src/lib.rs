use anchor_lang::prelude::*;

declare_id!("mdg7hsS3aWuWwSGVFTgC6KWpCaDJZ5qbEgWBQoGX4id");

#[program]
pub mod cardinal_metadata_generator {
    use super::*;

    pub fn create_metadata_config(ctx: Context<CreateMetadatConfigCtx>, ix: CreateMetadataConfigIx) -> ProgramResult {
        let metadata_config = &mut ctx.accounts.metadata_config;
        metadata_config.program_id = ix.program_id;
        metadata_config.seed_prefix = ix.seed_prefix;
        metadata_config.seed_postfix = ix.seed_postfix;
        metadata_config.fields = ix.fields;
        Ok(())
    }
}

pub const METADATA_CONFIG_SEED: &str = "metadata-config";

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMetadataConfigIx {
    pub seed_string: String,
    pub bump: u8,
    pub program_id: Pubkey,
    pub seed_prefix: Option<Vec<u8>>,
    pub seed_postfix: Option<Vec<u8>>,
    pub fields: Vec<String>,
}

#[derive(Accounts)]
#[instruction(ix: CreateMetadataConfigIx)]
pub struct CreateMetadatConfigCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = 256,
        seeds = [METADATA_CONFIG_SEED.as_bytes(), ix.seed_string.as_bytes()],
        bump = ix.bump,
    )]
    metadata_config: Account<'info, MetadataConfig>,
    #[account(mut)]
    payer: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

pub struct Attribute {
    pub address: Pubkey,
    pub account_type: String,
    pub fields: Vec<String>,
}

#[account]
pub struct MetadataConfig {
    pub uri: String,
    pub attrs: Vec<Attribute>,
}
