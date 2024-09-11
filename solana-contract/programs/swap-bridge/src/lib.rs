mod util;

use crate::util::bridge::Wormhole;
use crate::util::errors::ErrorCode;
use crate::util::swap::Jupiter;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("suobUdMc9nSaQ1TjRkQA4K6CR9CmDiU9QViN7kVw74T");

#[program]
pub mod swap_bridge {
    /// Program to swap SOL or USDC to a wrapped USDC token (e.g. USDCpo)
    /// and bridge it over to the chain where carbon tokens are to be bought and retired (e.g. Polygon) using Wormhole
    use super::*;
    use crate::util::bridge::call_bridge;
    use crate::util::errors::ErrorCode;
    use crate::util::token::approve_delegate;
    use anchor_lang::solana_program::instruction::Instruction;
    use anchor_lang::solana_program::program;

    pub fn initialize(
        ctx: Context<Initialize>,
        state_in: GenericStateInput,
        _state_index: u8,
    ) -> Result<()> {
        /* Initialise the state account with specific parameters

        Parameters
        ----------
        state_in: GenericStateInput specifying the content of the state account, including:
            state_in.output_mint: the output mint of the target token (e.g. USDCpo)
            state_in.holding_contract: the holding contract address on target chain
            state_in.token_chain_id: the Wormhole ID of the target chain
            state_in.update_authority: an account with the authority to update these parameters of the state account
        _state_index: index to differentiate different # of state accounts belonging to the same wallet
        */
        ctx.accounts.state.output_mint = state_in.output_mint;
        ctx.accounts.state.holding_contract = state_in.holding_contract;
        ctx.accounts.state.token_chain_id = state_in.token_chain_id;
        ctx.accounts.state.update_authority = state_in.update_authority;

        Ok(())
    }

    pub fn update_state(ctx: Context<UpdateState>, state_in: GenericStateInput) -> Result<()> {
        /* Update state account parameters

        Parameters
        ----------
        state_in: GenericStateInput specifying the content of the state account, including:
            state_in.output_mint: the output mint of the target token (e.g. USDCpo)
            state_in.holding_contract: the holding contract address on target chain
            state_in.token_chain_id: the Wormhole ID of the target chain
            state_in.update_authority: an account with the authority to update these parameters of the state account
        _state_index: index to differentiate different # of state accounts belonging to the same wallet
        */
        let state = &mut ctx.accounts.state;
        state.update_authority = state_in.update_authority;
        state.output_mint = state_in.output_mint;
        state.holding_contract = state_in.holding_contract;
        state.token_chain_id = state_in.token_chain_id;

        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, route_info: Vec<u8>) -> Result<()> {
        /* Swap SOL for wrapped USDC for the target chain using Jupiter

        Parameters
        ----------
        route_info: data for instructions from Jupiter specifying the route for swapping
        */
        let mut router_accounts = vec![];
        let state_address = ctx.accounts.state.key();
        let (token_authority, token_authority_bump) = State::get_token_authority(&state_address);
        // Set token_authority to be a signer
        for account in ctx.remaining_accounts {
            let is_signer = account.key == &token_authority;
            router_accounts.push(if account.is_writable {
                AccountMeta::new(*account.key, is_signer)
            } else {
                AccountMeta::new_readonly(*account.key, is_signer)
            });
        }

        let swap_ix = Instruction {
            program_id: *ctx.accounts.jupiter_program.key,
            accounts: router_accounts,
            data: route_info.clone(),
        };

        let authority_seeds = [
            State::TOKEN_AUTHORITY_SEED,
            state_address.as_ref(),
            &[token_authority_bump],
        ];

        program::invoke_signed(&swap_ix, ctx.remaining_accounts, &[&authority_seeds[..]])?;

        Ok(())
    }

    pub fn bridge<'info>(
        ctx: Context<'_, '_, '_, 'info, Bridge<'info>>,
        amount: u64,
        bridge_data: Vec<u8>,
    ) -> Result<()> {
        /* Brige a specified amount of wrapped USDC to target chain via Wormwhole

        Parameters
        ----------
        amount: amount to bridge over
        bridge_data: data for bridging instructions from Wormhole
        */
        let state_address = ctx.accounts.state.key();
        // Deserialise bridge_data to check if the recipient address on the target chain
        // is the same as the holding contract address specified in the state
        let deserialised_bridge_data =
            TransferWrapped::deserialize(&mut bridge_data.as_ref()).unwrap();
        msg!(
            "Holding contract address specified in state: {:?}",
            &ctx.accounts.state.holding_contract[2..]
        );
        msg!(
            "Holding contract address specified in input bridge data: {:?}",
            &hex::encode(deserialised_bridge_data.recipient_address).to_uppercase()
        );

        if hex::encode(deserialised_bridge_data.recipient_address).to_uppercase()
            != ctx.accounts.state.holding_contract.to_uppercase()[2..]
        {
            return Err(ErrorCode::IncorrectDestinationAccount.into());
        }

        let authority_seeds = [
            State::TOKEN_AUTHORITY_SEED,
            state_address.as_ref(),
            &[ctx.bumps.token_account_authority],
        ];

        approve_delegate(
            amount,
            &ctx.accounts.token_account.to_account_info(),
            &ctx.accounts.token_account_authority.to_account_info(),
            &ctx.accounts.bridge_authority.to_account_info(),
            &ctx.accounts.token_program,
            &authority_seeds,
        )?;

        call_bridge(
            bridge_data,
            ctx.remaining_accounts,
            &ctx.accounts.token_account_authority.to_account_info(),
            &ctx.accounts.wormhole_program,
            &authority_seeds,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(state_in: GenericStateInput, state_index: u8)]
pub struct Initialize<'info> {
    /// Initialize the state account
    #[account(
        init,
        payer = authority,
        seeds = [State::STATE_SEED, authority.key().as_ref(), &state_index.to_le_bytes()],
        bump,
        space = State::space(state_in.holding_contract, state_in.token_chain_id),
    )]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub state: Account<'info, State>,
    pub jupiter_program: Program<'info, Jupiter>,
}

#[derive(Accounts)]
pub struct Bridge<'info> {
    /// State account specifying the mint of the token being transferred through the bridge
    /// and the recipient address on the target chain
    pub state: Account<'info, State>,
    /// The wormhole bridge authority. This is the authority that will sign the bridge transaction
    /// and therefore needs to be a delegate on the token account.
    /// It will also be listed in the remainingAccounts list that are populated directly from the generated wormhole transaction on the client
    /// CHECK: this must be the wormhole token bridge authority signer, or the transaction will fail overall
    pub bridge_authority: UncheckedAccount<'info>,
    #[account(
    seeds = [State::TOKEN_AUTHORITY_SEED, state.key().as_ref()],
    bump
    )]
    /// CHECK: Derived from the state account
    pub token_account_authority: UncheckedAccount<'info>,
    /// The account containing tokens that will be transferred through the bridge
    #[account(token::authority = token_account_authority.key())]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub wormhole_program: Program<'info, Wormhole>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GenericStateInput {
    /// Mint of the wrapped USDC token to be bridged over to the target chain
    pub output_mint: Pubkey,
    /// Holding contract on the target chain to receive the bridged tokens
    pub holding_contract: String,
    /// Wormhole ID specifying the target chain
    pub token_chain_id: String,
    /// Authority who can update the data in the state account
    pub update_authority: Pubkey,
}

#[account]
pub struct State {
    /// Mint of the wrapped USDC token to be bridged over to the target chain
    output_mint: Pubkey,
    /// Holding contract on the target chain to receive the bridged tokens
    holding_contract: String,
    /// Wormhole ID specifying the target chain
    token_chain_id: String,
    /// Authority who can update the data in the state account
    update_authority: Pubkey,
}

impl State {
    pub const STATE_SEED: &'static [u8] = b"state_address";
    pub const TOKEN_AUTHORITY_SEED: &'static [u8] = b"token_authority";

    pub fn space(holding_contract: String, token_chain_id: String) -> usize {
        // Find space needed for state account for current config
        4 + holding_contract.len() + 4 + token_chain_id.len() + 4 + 32 + 32 + 8 /* Discriminator */
    }

    pub fn get_token_authority(state_address: &Pubkey) -> (Pubkey, u8) {
        // Derive token_authority address from the state account address
        Pubkey::find_program_address(&[Self::TOKEN_AUTHORITY_SEED, state_address.as_ref()], &id())
    }
}

#[derive(Accounts)]
#[instruction(state_in: GenericStateInput)]
pub struct UpdateState<'info> {
    // To be used for updating parameters of state account
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    mut,
    constraint = state.update_authority == payer.key() @ ErrorCode::Unauthorized,
    )]
    pub state: Account<'info, State>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
/// Schema for deserialising the bridge data from Wormhole
pub struct TransferWrapped {
    batch_id: u32,
    /// Amount to bridge
    amount: u64,
    fee: u64,
    /// Wormhole adds zeros in front of the recipient address to accommodate for different address lengths
    zeros_padding: [u8; 13],
    /// Recipient address on target chain
    recipient_address: [u8; 20],
    /// Wormhole ID for target chain
    recipient_chain: u16,
}
