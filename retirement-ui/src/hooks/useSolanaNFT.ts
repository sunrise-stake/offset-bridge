import {useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {PublicKey} from "@solana/web3.js";
import {Metaplex, walletAdapterIdentity, Nft, NftWithToken, Sft, SftWithToken} from "@metaplex-foundation/js";

type Asset = Nft | Sft | NftWithToken | SftWithToken
export const useSolanaNFT = (mintAddress: PublicKey | undefined) => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const metaplex = useMemo(
        () => Metaplex.make(connection).use(walletAdapterIdentity(wallet)),
        [connection, wallet]
    );

    const [asset, setAsset] = useState<Asset>();

    useEffect(() => {
        if (mintAddress) {
            metaplex.nfts().findByMint({
                mintAddress,
                loadJsonMetadata: false, // use this because the toucan.earth metadata is returning 404 at present
            }).then(setAsset);
        }
    }, [metaplex, mintAddress]);

    return asset
}