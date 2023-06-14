use anchor_lang::Id;
use anchor_lang::prelude::Pubkey;

pub struct Jupiter;

impl Id for Jupiter {
    fn id() -> Pubkey { jupiter_cpi::ID }
}