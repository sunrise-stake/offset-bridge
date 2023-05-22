// A helper function to help us find which output pair is possible
import {Token} from "./constants";

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