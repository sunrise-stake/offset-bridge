import {Transaction, VersionedTransaction} from "@solana/web3.js";
import {toast} from "react-toastify";
import {SolExplorerLink} from "@/components/solExplorerLink";
import {useConnection} from "@solana/wallet-adapter-react";
import {useWalletSafe} from "@/hooks/useWalletSafe";

export const useSolanaTxConfirm = ({
    successMessage = "Transaction successful",
    errorMessage = "Transaction failed"
}): (tx: Transaction | VersionedTransaction) => Promise<void> => {
    const wallet = useWalletSafe();
    const { connection } = useConnection();

    const confirmed = async (txSig: string) => {
        console.log("Transaction signature: {} Waiting for confirmation...", txSig);
        toast.info(<div>
            Waiting for confirmation:{' '}<SolExplorerLink address={txSig} type="tx"/>
        </div>);
        const blockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight,
            signature: txSig,
        })
        return txSig
    }

    const successful = (txSig: string) => {
        toast.success(<div>
            {successMessage}:{' '}<SolExplorerLink address={txSig} type="tx"/>
        </div>);
    }

    const failed = (error: Error) => {
        toast.error(<div>
            {errorMessage}: {error.message}
        </div>);
    }

    return (tx: Transaction | VersionedTransaction) =>
        wallet.sendTransaction(tx, connection)
            .then(confirmed)
            .then(successful)
            .catch(failed);
}