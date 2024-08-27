import {PublicKey} from "@solana/web3.js";
import {SolanaToken, WRAPPED_SOL_TOKEN_MINT} from "@/lib/constants";
import {useSolanaTokenBalance} from "@/hooks/useSolanaTokenBalance";
import {useSolanaSolBalance} from "@/hooks/useSolanaSolBalance";
import {deriveTokenAuthority} from "@/lib/util";
import {getAssociatedTokenAddressSync} from "spl-token-latest";
import {useAppStore} from "@/app/providers";

type DepositBalances = {
    userTokenBalance: bigint | undefined;
    userSolBalance: bigint | undefined;
    tokenAuthorityTokenBalance: bigint | undefined;
    tokenAuthorityUnwrappedSolBalance: bigint | undefined;
    tokenAuthoritySwappedBalance: bigint | undefined;
}

/**
 * The following accounts are of interest during the deposit step:
 *
 * 1. The user's SPL balance (if depositing SPL)
 * 2. The user's SOL balance (if depositing SOL)
 * 3. The SPL balance of the token ATA belonging to the token authority (if depositing SPL)
 * 4. The SOL balance of the wrapped SOL ATA belonging to the token authority (if depositing SOL)
 * 5. The Wrapped SOL balance of the token ATA belonging to the token authority (if depositing SOL)
 * 6. The SPL balance of the output token ATA belonging to the token authority
 *
 * If 4 is non-zero, a wrap instruction should be executed to convert the SOL to wrapped SOL before the swap takes place.
 */
export const useDepositBalances = (owner: PublicKey, inputTokenMint: PublicKey, outputTokenMint: PublicKey): DepositBalances => {
    const stateAddress = useAppStore(state => state.solanaStateAddress);
    const tokenAuthority = stateAddress ? deriveTokenAuthority(new PublicKey(stateAddress)) : undefined;
    const tokenAuthorityWrappedSolATA = tokenAuthority ? getAssociatedTokenAddressSync(new PublicKey(WRAPPED_SOL_TOKEN_MINT), tokenAuthority, true) : undefined;

    // 1. The user's SPL balance (if depositing SPL)
    const userTokenBalance = useSolanaTokenBalance(inputTokenMint, owner);
    // 2. The user's SOL balance (if depositing SOL)
    const userSolBalance = useSolanaSolBalance(owner);
    // 3. The SPL balance of the token ATA belonging to the token authority (if depositing SPL)
    // this is also
    // 5. The Wrapped SOL balance of the token ATA belonging to the token authority (if depositing SOL)
    const tokenAuthorityTokenBalance = useSolanaTokenBalance(inputTokenMint, tokenAuthority);
    // 4. The SOL balance of the wrapped SOL ATA belonging to the token authority (if depositing SOL)
    const tokenAuthorityUnwrappedSolBalance = useSolanaSolBalance(tokenAuthorityWrappedSolATA);
    // 6. The SPL balance of the output token ATA belonging to the token authority
    const tokenAuthoritySwappedBalance = useSolanaTokenBalance(outputTokenMint, tokenAuthority);

    return {
        userTokenBalance,
        userSolBalance,
        tokenAuthorityTokenBalance,
        tokenAuthorityUnwrappedSolBalance,
        tokenAuthoritySwappedBalance
    }
}