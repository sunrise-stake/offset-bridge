export const WORMHOLE_BRIDGE_ABI = [{
    inputs: [
        {
            internalType: "bytes",
            name: "encodedVm",
            type: "bytes",
        },
    ],
    name: "completeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
}] as const;