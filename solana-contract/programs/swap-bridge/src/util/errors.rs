use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Wormhole target address does not match holding contract specified in state")]
    IncorrectDestinationAccount,

    #[msg("Incorrect update authority")]
    Unauthorized,
}