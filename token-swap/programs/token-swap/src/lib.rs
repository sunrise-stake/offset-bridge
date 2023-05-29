mod util;

use anchor_lang::prelude::*;

declare_id!("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");

#[program]
pub mod token_swap {
    use anchor_lang::solana_program::instruction::Instruction;
    use anchor_lang::solana_program::program;
    use crate::util::token::create_token_account;
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, input_mint: Pubkey, output_mint: Pubkey) -> Result<()> {
        ctx.accounts.state.output_mint = output_mint;
        ctx.accounts.state.output_account = output_account;
        let state_address = ctx.accounts.state.key();
        let (input_account, input_account_bump) = State::get_input_account(&state_address);

        // // create ATA for the input and output mints
        // create_token_account(
        //     &ctx.accounts.associated_token_program,
        //     payer,
        //     &ctx.accounts.input_token_account,
        //     state_address,
        //     &ctx.accounts.input_mint,
        //     &ctx.accounts.system_program,
        //     &ctx.accounts.token_program,
        // )?;

        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, route_info: Vec<u8>) -> Result<()> {

        let mut router_accounts = vec![];
        // router_accounts.push(
        //     AccountMeta::new(*account.key, is_signer)
        // );
        let state_address = ctx.accounts.state.key();
        let (input_account, input_account_bump) = State::get_input_account(&state_address);
        let mut i = 0;
        for account in &ctx.remaining_accounts[..] {
            let is_signer = account.key == &input_account;
            // if is_signer {
            //     msg!("{}, Account: {} is signer: {}", i, account.key, is_signer);
            // }
            i = i + 1;
            router_accounts.push(if account.is_writable {
                AccountMeta::new(*account.key, is_signer)
            } else {
                AccountMeta::new_readonly(*account.key, is_signer)
            });
        }
        let swap_ix = Instruction {
            program_id: jupiter_cpi::ID,
            accounts: router_accounts,
            data: route_info.clone(),
        };

        let authority_seeds= [State::SEED, state_address.as_ref(), &[input_account_bump]];

        program::invoke_signed(
            &swap_ix,
            &ctx.remaining_accounts[..],
            &[&authority_seeds[..]],
        )?;
        // let swap_ix = Instruction {
        //     program_id: jupiter_cpi::ID,
        //     accounts,
        //     data: jupiter_override::Route {
        //         swap_leg,
        //         in_amount: quote_response.in_amount,
        //         quoted_out_amount: 0,
        //         slippage_bps: 0,
        //         platform_fee_bps: 0,
        //     }.data(),
        // };

        Ok(())
    }

    // pub fn bridge()
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
    pub state: Account<'info, State>
}

#[account]
pub struct State {
    output_mint: Pubkey,     // The target token mint
    output_account: Pubkey   // The target token account for the mint (must already exist)
}
impl State {
    pub const SIZE: usize = 8 + 32 + 32 + 32; // include 8 bytes for the anchor discriminator

    pub const SEED: &'static [u8] = b"input_account";

    pub fn get_input_account(state_address: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[Self::SEED, state_address.as_ref()],
            &id(),
        )
    }
}