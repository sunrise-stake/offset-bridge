use anchor_lang::prelude::*;
use anchor_lang::ToAccountInfo;

pub fn create_token_account<'a>(
    associated_token_program: &Program<'a, AssociatedToken>,
    payer: &AccountInfo<'a>,
    token_account: &AccountInfo<'a>,
    token_account_owner: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    token_program: &Program<'a, Token>,
) -> Result<()> {
    anchor_spl::associated_token::create(CpiContext::new_with_signer(
        associated_token_program.to_account_info(),
        anchor_spl::associated_token::Create {
            payer: payer.to_account_info(),
            associated_token: token_account.to_account_info(),
            authority: token_account_owner.to_account_info(),
            mint: mint.to_account_info(),
            system_program: system_program.to_account_info(),
            token_program: token_program.to_account_info(),
        }, signer_seeds
    ))?;

    Ok(())
}