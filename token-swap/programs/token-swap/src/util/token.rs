use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, Approve};

pub fn approve_delegate<'a>(
    amount: u64,
    token_account: &AccountInfo<'a>,
    token_account_owner: &AccountInfo<'a>,
    delegate: &AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    msg!("Approving delegate for {}", amount);
    let seeds = [&signer_seeds[..]];
    let cpi_accounts = Approve {
        to: token_account.clone(),
        delegate: delegate.clone(),
        authority: token_account_owner.clone(),
    };
    let cpi_program = token_program.to_account_info().clone();
    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program,
        cpi_accounts,
        &seeds
    );
    token::approve(cpi_ctx, amount)?;

    Ok(())
}