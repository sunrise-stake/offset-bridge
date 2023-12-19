mod util;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use pyth_sdk_solana::{load_price_feed_from_account_info, Price, PriceFeed};
use crate::util::errors::ErrorCode;
use crate::util::bridge::Wormhole;
use crate::util::swap::Jupiter;
use crate::util::token::wrapped_sol::ID as WRAPPED_SOL;

declare_id!("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");

#[program]
pub mod token_swap {
    use anchor_lang::solana_program::instruction::Instruction;
    use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
    use anchor_lang::solana_program::program;
    use crate::util::bridge::call_bridge;
    use crate::util::token::{approve_delegate, wrap_sol};
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, input_mint: Pubkey, output_mint: Pubkey, swap_rate_tolerance: u64, pyth_price_feed_key: Pubkey, price_feed_staleness_threshold: u64, update_authority: Pubkey) -> Result<()> { 
        ctx.accounts.state.input_mint = input_mint;
        ctx.accounts.state.output_mint = output_mint;
        ctx.accounts.state.tolerance = swap_rate_tolerance;
        ctx.accounts.state.pyth_price_feed_key = pyth_price_feed_key;
        ctx.accounts.state.price_feed_staleness_threshold = price_feed_staleness_threshold;
        ctx.accounts.state.update_authority = update_authority;
        //let (token_authority, token_authority_bump) = State::get_token_authority(&ctx.accounts.state.key());

        Ok(())
    }

    pub fn update(ctx: Context<UpdateState>, input_mint: Pubkey, output_mint: Pubkey, swap_rate_tolerance: u64, pyth_price_feed_key: Pubkey, price_feed_staleness_threshold: u64) -> Result<()> { 
        ctx.accounts.state.input_mint = input_mint;
        ctx.accounts.state.output_mint = output_mint;
        ctx.accounts.state.tolerance = swap_rate_tolerance;
        ctx.accounts.state.pyth_price_feed_key = pyth_price_feed_key;
        ctx.accounts.state.price_feed_staleness_threshold = price_feed_staleness_threshold;

        Ok(())
    }

    pub fn wrap(ctx: Context<Wrap>) -> Result<()> {
        let state_address = ctx.accounts.state.key();
        let authority_seeds= [State::SEED, state_address.as_ref(), &[ctx.bumps.token_account_authority]];
        wrap_sol(
            &ctx.accounts.token_account.to_account_info(),
            &ctx.accounts.token_program,
            &authority_seeds[..],
        )
    }

    pub fn swap(ctx: Context<Swap>, route_info: Vec<u8>) -> Result<()> {

        let mut router_accounts = vec![];
        let state_address = ctx.accounts.state.key();
        let (token_authority, token_authority_bump) = State::get_token_authority(&state_address);
        if ctx.accounts.token_account_authority.key() != token_authority {
            return Err(ErrorCode::IncorrectTokenAuthority.into());
        }
        for account in &ctx.remaining_accounts[..] {
            let is_signer = account.key == &token_authority;
            router_accounts.push(if account.is_writable {
                AccountMeta::new(*account.key, is_signer)
            } else {
                AccountMeta::new_readonly(*account.key, is_signer)
            });
        }
        // TODO: return error when these accounts do not exist within ctx.remaining_accounts

        let input_initial_balance = ctx.accounts.token_ata_address_in.amount as f64;
        let output_intitial_balance = ctx.accounts.token_ata_address_out.amount as f64;
        // TODO: Check that the jupiter output account (the account that receives the tokens)
        // is the account in the state

        // TODO: Oracle check to ensure the price is correct
        if ctx.accounts.pyth_price_feed_account.key() != ctx.accounts.state.pyth_price_feed_key {
            return Err(ErrorCode::IncorrectPriceFeedOracleAccount.into());
        }
        
        let price_feed: PriceFeed = load_price_feed_from_account_info( &ctx.accounts.pyth_price_feed_account ).unwrap();      
        let current_timestamp = Clock::get()?.unix_timestamp;
        let current_price: Price = price_feed.get_price_no_older_than(current_timestamp, ctx.accounts.state.price_feed_staleness_threshold).unwrap();
        msg!("price: ({} +- {}) x 10^{}", current_price.price, current_price.conf, current_price.expo);
        let base: f64 = 10.0;
        let expected_swap_rate: f64 = current_price.price as f64 * (base.powi(current_price.expo as i32) as f64);
        msg!("expected_swap_rate: {}", expected_swap_rate);

        let swap_ix = Instruction {
            program_id: *ctx.accounts.jupiter_program.key,
            accounts: router_accounts,
            data: route_info.clone(),
        };

        let authority_seeds = [State::SEED, state_address.as_ref(), &[token_authority_bump]];

        program::invoke_signed(
            &swap_ix,
            &ctx.remaining_accounts[..],
            &[&authority_seeds[..]],
        )?;
        // while transfer_done.is_ok() != true {
        /*
        while output_intitial_balance == ctx.accounts.token_ata_address_out.amount as f64 {
            msg!("waiting for transfer to finish");
            let input_final_balance = ctx.remaining_accounts[input_account_idx].lamports() as f64;
            let output_final_balance = ctx.accounts.token_ata_address_out.amount as f64;
            msg!("{}, {}, {}, {}, {}, {}, {}", output_final_balance, output_intitial_balance, input_initial_balance, input_final_balance, expected_swap_rate, ctx.accounts.state.tolerance, (expected_swap_rate * ((100 - ctx.accounts.state.tolerance) as f64 / 100.0)) as f64);
        }; */
        ctx.accounts.token_ata_address_in.reload()?;
        let input_final_balance = ctx.accounts.token_ata_address_in.amount as f64;
        ctx.accounts.token_ata_address_out.reload()?;
        let output_final_balance = ctx.accounts.token_ata_address_out.amount as f64;
        msg!("{}, {}, {}, {}, {}, {}, {}", output_final_balance, output_intitial_balance, input_initial_balance, input_final_balance, expected_swap_rate, ctx.accounts.state.tolerance, (expected_swap_rate * ((100 - ctx.accounts.state.tolerance) as f64 / 100.0)) as f64);

        if (output_final_balance - output_intitial_balance) * base.powi(ctx.accounts.input_mint.decimals as i32) as f64 / base.powi(ctx.accounts.output_mint.decimals as i32)
            / (input_initial_balance - input_final_balance)
            < (expected_swap_rate * ((100 - ctx.accounts.state.tolerance) as f64 / 100.0)) as f64
        {
            return Err(ErrorCode::UndesirableSwapRate.into());
        }

        Ok(())
    }

    pub fn bridge<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Bridge<'info>>, amount: u64, bridge_data: Vec<u8>) -> Result<()> {
        let state_address = ctx.accounts.state.key();
        let authority_seeds= [State::SEED, state_address.as_ref(), &[ctx.bumps.token_account_authority]];

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
    #[account(
        init,
        payer = authority,
        seeds = [State::SEED, state.key().as_ref()],
        space = 8,
        bump,
    )]
    /// CHECK: Derived from the state account
    pub token_account_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateState<'info> {
    #[account(mut, constraint = state.update_authority == authority.key())]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,    
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub state: Account<'info, State>,
    #[account(
    seeds = [State::SEED, state.key().as_ref()],
    bump
    )]
    /// CHECK: Derived from the state account
    pub token_account_authority: UncheckedAccount<'info>,
    #[account(constraint = input_mint.key() == state.input_mint)]
    pub input_mint: Account<'info, Mint>,
    #[account(
    mut,
    associated_token::mint=state.input_mint,
    associated_token::authority=token_account_authority.key(),
    )]
    pub token_ata_address_in: Account<'info, TokenAccount>,
    #[account(constraint = output_mint.key() == state.output_mint)]
    pub output_mint: Account<'info, Mint>,
    #[account(
    mut,
    associated_token::mint=state.output_mint,
    associated_token::authority=token_account_authority.key(),
    )]
    pub token_ata_address_out: Account<'info, TokenAccount>,
    pub jupiter_program: Program<'info, Jupiter>,
    /// CHECK: the price feed account needs to correspond to the exchange pair
    pub pyth_price_feed_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Wrap<'info> {
    pub state: Account<'info, State>,
    #[account(
    seeds = [State::SEED, state.key().as_ref()],
    bump
    )]
    /// CHECK: Derived from the state account
    pub token_account_authority: UncheckedAccount<'info>,
    /// The account containing tokens that will be transferred through the bridge
    #[account(token::authority = token_account_authority.key(), token::mint = WRAPPED_SOL)]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
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
    input_mint: Pubkey, // The input token mint
    output_mint: Pubkey, // The target token mint
    tolerance: u64, // % tolerance in deviation of swap rate 
    pyth_price_feed_key: Pubkey,
    price_feed_staleness_threshold: u64, // staleness threshold in seconds
    update_authority: Pubkey
}

impl State {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 32 + 8; // include 8 bytes for the anchor discriminator

    pub const SEED: &'static [u8] = b"input_account"; // TODO rename to token_authority

    pub fn get_token_authority(state_address: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[Self::SEED, state_address.as_ref()],
            &id(),
        )
    }
}