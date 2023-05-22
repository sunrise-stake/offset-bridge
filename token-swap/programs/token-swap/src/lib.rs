use anchor_lang::prelude::*;

declare_id!("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");

#[program]
pub mod token_swap {
    use anchor_lang::InstructionData;
    use anchor_lang::solana_program::instruction::Instruction;
    use jupiter_cpi::jupiter_override;
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, output_mint: Pubkey, output_account: Pubkey) -> Result<()> {
        ctx.accounts.state.output_mint = output_mint;
        ctx.accounts.state.output_account = output_account;
        Ok(())
    }

    pub fn swap(_ctx: Context<Swap>, _amount: u64) -> Result<()> {
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

    pub fn get_input_account(state_address: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[b"input_account", state_address.as_ref()],
            &id(),
        ).0
    }
}