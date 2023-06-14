import {FC} from "react";
import {trimAddress} from "@/lib/util";
import {VAAResult} from "@/api/solanaRetirement";
import {VAAResultStored} from "@/app/providers";

export const WormholeLink:FC<{ details: VAAResultStored }> = ({ details: {emitterChain, emitterAddress, sequence} }) => <a className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
                               href={`https://wormhole.com/explorer/?emitterChain=${emitterChain}&emitterAddress=${emitterAddress}&sequence=${sequence}`} target="_blank"
                               rel="noreferrer">{sequence}</a>;