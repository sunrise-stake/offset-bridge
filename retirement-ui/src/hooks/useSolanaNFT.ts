import {useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {Metaplex, walletAdapterIdentity, Nft, NftWithToken, Sft, SftWithToken, Metadata} from "@metaplex-foundation/js";
import {RETIREMENT_CERT_MINT_AUTHORITY_SOLANA} from "@/lib/constants";

type Asset = Metadata | Nft | Sft | NftWithToken | SftWithToken
export const useSolanaNFT = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const metaplex = useMemo(
        () => Metaplex.make(connection).use(walletAdapterIdentity(wallet)),
        [connection, wallet]
    );

    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        if (wallet.publicKey) {
            metaplex.nfts().findAllByOwner({
                owner: wallet.publicKey,
            }).then(found =>
                found.filter(asset => asset.updateAuthorityAddress.equals(RETIREMENT_CERT_MINT_AUTHORITY_SOLANA))
            // ).then(found => {
            //     const loaded = found.map(metadata => metaplex.nfts().findByMint({
            //         mintAddress: metadata.
            //     }
            //     // const loaded = found.map(metadata => metaplex.nfts().load({
            //     //     metadata: metadata.
            //     //     loadJsonMetadata: false,    // TODO temp
            //     // }));
            //     return Promise.all(loaded)
            ).then(setAssets);
        }
    }, [metaplex, wallet.publicKey?.toBase58()]);

    return assets
}