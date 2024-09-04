use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{sync_native, Approve, SyncNative, Token};

pub fn approve_delegate<'a>(
    amount: u64,
    token_account: &AccountInfo<'a>,
    token_account_owner: &AccountInfo<'a>,
    delegate: &AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    /* To approve the bridge (Wormhole) as a delagate of an amount of funds in the token_account

    Parameters
    ----------
    amount: amount of funds to delegate to Wormhole
    token_account: address of the account which contains the funds to delegate
    token_account_owner: owner of the token_account (i.e. the token authority)
    delegate: account to which the funds woule be delegated (Wormholde bridge authority)
    token_program: Token Program for carrying out CPI transfer
    signer_seeds: seeds of signers (i.e. the token authority)
    */
    msg!("Approving delegate for {}", amount);
    let seeds = [signer_seeds];
    let cpi_accounts = Approve {
        to: token_account.clone(),
        delegate: delegate.clone(),
        authority: token_account_owner.clone(),
    };
    let cpi_program = token_program.to_account_info().clone();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &seeds);
    token::approve(cpi_ctx, amount)?;

    Ok(())
}

pub fn wrap_sol<'a>(
    token_account: &AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    let cpi_program = token_program.to_account_info();
    let cpi_accounts = SyncNative {
        account: token_account.to_account_info(),
    };
    let seeds = [signer_seeds];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &seeds);
    sync_native(cpi_ctx)
}

pub(crate) mod wrapped_sol {
    use super::*;
    declare_id!("So11111111111111111111111111111111111111112");
}
