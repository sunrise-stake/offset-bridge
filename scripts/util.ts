// A helper function to help us find which output pair is possible
import {BRIDGE_INPUT_MINT_ADDRESS, PROGRAM_ID, SOL_TOKEN_BRIDGE_ADDRESS, STATE_ADDRESS, JupiterToken} from "./constants";
import {PublicKey} from "@solana/web3.js";
import {getAssociatedTokenAddressSync} from "spl-token-latest";

const getPossiblePairsTokenInfo = ({
                                       tokens,
                                       routeMap,
                                       inputToken,
                                   }: {
    tokens: JupiterToken[];
    routeMap: Map<string, string[]>;
    inputToken?: JupiterToken;
}) => {
    const possiblePairs = routeMap.get(inputToken.address)
    const possiblePairsTokenInfo: { [key: string]: JupiterToken | undefined } = {};
    possiblePairs.forEach((address) => {
        possiblePairsTokenInfo[address] = tokens.find((t) => {
            return t.address == address;
        });
    });

    return possiblePairsTokenInfo;
};

export const tokenAuthority = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
export const bridgeAuthority = PublicKey.findProgramAddressSync([Buffer.from("authority_signer")], new PublicKey(SOL_TOKEN_BRIDGE_ADDRESS))[0];
export const bridgeInputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(BRIDGE_INPUT_MINT_ADDRESS), tokenAuthority, true);