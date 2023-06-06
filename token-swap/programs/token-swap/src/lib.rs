mod util;

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::util::bridge::Wormhole;
use crate::util::swap::Jupiter;

declare_id!("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");

#[program]
pub mod token_swap {
    use anchor_lang::solana_program::instruction::Instruction;
    use anchor_lang::solana_program::program;
    use crate::util::bridge::call_bridge;
    use crate::util::token::{approve_delegate};
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, output_mint: Pubkey) -> Result<()> {
        ctx.accounts.state.output_mint = output_mint;

        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, route_info: Vec<u8>) -> Result<()> {

        let mut router_accounts = vec![];
        let state_address = ctx.accounts.state.key();
        let (token_authority, token_authority_bump) = State::get_token_authority(&state_address);
        for account in &ctx.remaining_accounts[..] {
            let is_signer = account.key == &token_authority;
            router_accounts.push(if account.is_writable {
                AccountMeta::new(*account.key, is_signer)
            } else {
                AccountMeta::new_readonly(*account.key, is_signer)
            });
        }

        // TODO: Check that the jupiter output account (the account that receives the tokens)
        // is the account in the state

        // TODO: Oracle check to ensure the price is correct

        let swap_ix = Instruction {
            program_id: jupiter_cpi::ID,
            accounts: router_accounts,
            data: route_info.clone(),
        };

        let authority_seeds= [State::SEED, state_address.as_ref(), &[token_authority_bump]];

        program::invoke_signed(
            &swap_ix,
            &ctx.remaining_accounts[..],
            &[&authority_seeds[..]],
        )?;

        Ok(())
    }

    pub fn bridge<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Bridge<'info>>, amount: u64, bridge_data: Vec<u8>) -> Result<()> {
        let state_address = ctx.accounts.state.key();
        let authority_seeds= [State::SEED, state_address.as_ref(), &[*ctx.bumps.get("token_account_authority").unwrap()]];

        approve_delegate(
            amount,
            &ctx.accounts.token_account.to_account_info(),
            &ctx.accounts.token_account_authority.to_account_info(),
            &ctx.accounts.bridge_authority.to_account_info(),
            &ctx.accounts.token_program,
            &authority_seeds
        )?;

        call_bridge(
            bridge_data,
            &ctx.remaining_accounts,
            &ctx.accounts.token_account_authority.to_account_info(),
            &ctx.accounts.wormhole_program,
            &authority_seeds
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = State::SIZE,
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
    /// The state account that identifies the mint of the token being transferred through the bridge
    /// and is also the token account authority
    pub state: Account<'info, State>,
    /// The wormhole bridge authority. This is the authority that will sign the bridge transaction
    /// and therefore needs to be a delegate on the token account.
    /// It will also be listed in the remainingAccounts list that are populated directly from the generated wormhole transaction on the client
    /// CHECK: this must be the wormhole token bridge authority signer, or the transaction will fail overall
    pub bridge_authority: UncheckedAccount<'info>,
    #[account(
    seeds = [State::SEED, state.key().as_ref()],
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

#[account]
pub struct State {
    output_mint: Pubkey,     // The target token mint
}

impl State {
    pub const SIZE: usize = 8 + 32 + 32 + 32; // include 8 bytes for the anchor discriminator

    pub const SEED: &'static [u8] = b"input_account"; // TODO rename to token_authority

    pub fn get_token_authority(state_address: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[Self::SEED, state_address.as_ref()],
            &id(),
        )
    }
}