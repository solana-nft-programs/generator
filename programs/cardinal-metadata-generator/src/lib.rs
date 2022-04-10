use anchor_lang::prelude::*;
use mpl_token_metadata::state::Metadata;

declare_id!("Fr66EvvzsspaWwC2TiuSPg6RDwjypvDgshSucFjtnYEK");

#[program]
pub mod cardinal_generator {
    use super::*;

    pub fn create_metadata_config(ctx: Context<CreateMetadatConfigCtx>, ix: CreateMetadataConfigIx) -> Result<()> {
        let metadata_config = &mut ctx.accounts.metadata_config;
        metadata_config.attributes = ix.attributes;
        Ok(())
    }
}

pub const METADATA_CONFIG_SEED: &str = "metadata-config";

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMetadataConfigIx {
    pub seed_string: String,
    pub attributes: Vec<Attribute>,
}

#[derive(Accounts)]
#[instruction(ix: CreateMetadataConfigIx)]
pub struct CreateMetadatConfigCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = 512,
        seeds = [METADATA_CONFIG_SEED.as_bytes(), ix.seed_string.as_bytes()],
        bump,
    )]
    metadata_config: Box<Account<'info, MetadataConfig>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_metadata: UncheckedAccount<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Default, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Attribute {
    pub address: Pubkey,
    pub account_type: String,
    pub fields: Vec<String>,
}

#[account]
pub struct MetadataConfig {
    pub base_metadata_uri: String,
    pub attributes: Vec<Attribute>,
}
