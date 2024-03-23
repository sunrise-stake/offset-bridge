use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Swap rate below accepted tolerance")]
    UndesirableSwapRate,

    #[msg("Incorrect token authority")]
    IncorrectTokenAuthority,

    #[msg("Incorrect pyth price feed oracle account")]
    IncorrectPriceFeedOracleAccount,
}