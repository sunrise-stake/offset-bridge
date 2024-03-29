import {FC} from "react";

export const PolyExplorerLink:FC<{
    address: string,
    type: 'tx' | 'address' | 'token',
}> = ({ address, type }) => {
    const trimmedAddress = address.slice(0, 4) + '...' + address.slice(-4);
    return <a className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer" href={`https://polygonscan.com/${type}/${address}`} target="_blank" rel="noreferrer">{trimmedAddress}</a>;
};