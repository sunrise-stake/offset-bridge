use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program;

// wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb
pub const WORMHOLE_TOKEN_BRIDGE_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    14, 10, 88, 158, 100, 136, 20, 122, 148, 220, 250, 89, 43, 144, 253, 212, 17, 82, 187, 44, 167,
    123, 246, 1, 103, 88, 166, 244, 223, 157, 33, 180,
]);

pub struct Wormhole;

impl Id for Wormhole {
    fn id() -> Pubkey {
        WORMHOLE_TOKEN_BRIDGE_PROGRAM_ID
    }
}

pub fn call_bridge<'a>(
    bridge_data: Vec<u8>,
    accounts: &[AccountInfo<'a>],
    token_account_authority: &AccountInfo<'a>,
    wormhole_program: &Program<'a, Wormhole>,
    signer_seeds: &[&[u8]],
) -> Result<()> {
    /* To call and bridge funds to target chain

    Parameters
    ----------
    bridge_data: data for bridging instructions from Wormhole
    accounts: accounts involved in the bridging instructions
    token_account_authority: the token authority (also the input account PDA)
    wormhole_program: the Wormhole program to carry out the bridging action
    signer_seeds: seeds of signers (i.e. the token authority)
    */
    let mut router_accounts = vec![];
    for account in accounts {
        // transaction signers are:
        // - the source of the funds (input account PDA)
        // - the message account (generated by the client and must cosign the original transaction)
        let is_signer = account.key == token_account_authority.key || account.is_signer;
        router_accounts.push(if account.is_writable {
            AccountMeta::new(*account.key, is_signer)
        } else {
            AccountMeta::new_readonly(*account.key, is_signer)
        });
    }
    router_accounts.push(AccountMeta::new_readonly(*wormhole_program.key, false));
    let bridge_ix = Instruction {
        program_id: WORMHOLE_TOKEN_BRIDGE_PROGRAM_ID,
        accounts: router_accounts,
        data: bridge_data.clone(),
    };

    msg!("Bridge data: {:?}", bridge_ix.data);

    msg!("Invoking bridge with {} accounts", accounts.len());

    program::invoke_signed(&bridge_ix, accounts, &[signer_seeds])?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_wormhole_token_bridge_program_id() {
        assert_eq!(
            WORMHOLE_TOKEN_BRIDGE_PROGRAM_ID,
            Pubkey::from_str("wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb").unwrap()
        );
    }
}
