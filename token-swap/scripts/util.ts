// A helper function to help us find which output pair is possible
import {Token} from "./constants";
import {PublicKey} from "@solana/web3.js";

const getPossiblePairsTokenInfo = ({
                                       tokens,
                                       routeMap,
                                       inputToken,
                                   }: {
    tokens: Token[];
    routeMap: Map<string, string[]>;
    inputToken?: Token;
}) => {
    const possiblePairs = routeMap.get(inputToken.address)
    var possiblePairsTokenInfo: { [key: string]: Token | undefined } = {};
    possiblePairs.forEach((address) => {
        possiblePairsTokenInfo[address] = tokens.find((t) => {
            return t.address == address;
        });
    });

    return possiblePairsTokenInfo;
};

export const PROGRAM_ID = new PublicKey("sutsaKhPL3nMSPtvRY3e9MbpmqQbEJip6vYqT9AQcgN");
export const STATE_ADDRESS = new PublicKey("FhVZksvDo2dFUCoqEwqv8idS9i4FtQ97amkcJ1d4MHS5");

export const inputAccount = PublicKey.findProgramAddressSync([Buffer.from("input_account"), STATE_ADDRESS.toBuffer()], PROGRAM_ID)[0];
