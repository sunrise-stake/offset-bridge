import {FC} from "react";
import {trimAddress} from "@/lib/util";

export const SolExplorerLink:FC<{
    address: string,
    type: 'tx' | 'address' | 'token',
}> = ({ address, type }) => <a className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
                               href={`https://solana.fm/${type}/${address}`} target="_blank"
                               rel="noreferrer">{trimAddress(address)}</a>;