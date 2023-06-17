import {Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import * as Wormhole from "@certusone/wormhole-sdk";
import {createTransferWrappedInstruction} from "@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge";
import {
    CHAIN_ID_POLYGON,
    SOL_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
    USDC_TOKEN_POLYGON
} from "./constants";

type TransferTransactionInformation = {
    instruction: TransactionInstruction;
    messageKey: Keypair;
}

export const createWormholeWrappedTransfer = async (
    payerAddress: PublicKey,
    fromAddress: PublicKey,
    tokenAuthority: PublicKey,
    amount: bigint,
    targetAddress: Uint8Array,
): Promise<TransferTransactionInformation> => {
    const nonce = Wormhole.createNonce().readUInt32LE(0);
    const messageKey = Keypair.generate();
    const tokenBridgeTransferIx = createTransferWrappedInstruction(
        SOL_TOKEN_BRIDGE_ADDRESS,
        SOL_BRIDGE_ADDRESS,
        payerAddress,
        messageKey.publicKey,
        fromAddress,
        tokenAuthority,
        CHAIN_ID_POLYGON, // The origin chain of the wrapped token is polygon
        // USDC_TOKEN_POLYGON,
        Wormhole.tryNativeToUint8Array(USDC_TOKEN_POLYGON, CHAIN_ID_POLYGON), // The origin address of the wrapped token is the USDC token address on polygon
        nonce,
        amount,
        0n,
        targetAddress,
        CHAIN_ID_POLYGON
    );

    // the token authority is a PDA. the instruction be "signed2 by the program when sent to wormhole via CPI.
    // so we don't want an explicit signer here
    tokenBridgeTransferIx.keys.find((key) => key.pubkey.equals(tokenAuthority))!.isSigner = false;

    return { instruction: tokenBridgeTransferIx, messageKey }
}