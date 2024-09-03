import {
    CHAIN_ID_POLYGON,
    POLYGON_BRIDGE_ADDRESS, POLYGON_NFT_BRIDGE_ADDRESS,
    WORMHOLE_RPC_HOSTS_MAINNET
} from "@/lib/constants";
import {VAAResult} from "@/lib/types";
import {getEmitterAddressEth, getSignedVAAWithRetry, parseSequenceFromLogEth} from "@certusone/wormhole-sdk";
import {TransactionReceipt} from "viem";
import {ContractReceipt} from "ethers";

export const getVAAFromPolygonTransactionSignature = async (receipt: TransactionReceipt): Promise<VAAResult> => {
    // Get the sequence number and emitter address required to fetch the signedVAA of our message
    // Note - to deal with an issue in the wormhole sdk, we need to lowercase the bridge address and the addresses in the receipt logs
    receipt.logs.forEach((log) => {
        log.address = log.address.toLowerCase() as `0x${string}`;
    });
    const sequence = parseSequenceFromLogEth(receipt as unknown as ContractReceipt, POLYGON_BRIDGE_ADDRESS.toLowerCase());
    const emitterAddress = getEmitterAddressEth(POLYGON_NFT_BRIDGE_ADDRESS);

// Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    const { vaaBytes } = await getSignedVAAWithRetry(
        WORMHOLE_RPC_HOSTS_MAINNET,
        CHAIN_ID_POLYGON,
        emitterAddress,
        sequence
    );

    return {
        sequence,
        emitterAddress,
        emitterChain: CHAIN_ID_POLYGON,
        vaaBytes
    };
}