import {AnchorWallet} from "@solana/wallet-adapter-react";
import {Connection, PublicKey} from "@solana/web3.js";
import {ENV, JupiterToken} from "../../../scripts/constants";
import fetch from "node-fetch";
import {TOKEN_LIST_URL} from "@jup-ag/core";

export class SolanaRetirement {
    ready: boolean = false;
    tokens: JupiterToken[] = [];

    constructor(readonly wallet: AnchorWallet, readonly connection: Connection) {
    }

    async init(): Promise<void> {
        this.tokens = await (await fetch(TOKEN_LIST_URL[ENV])).json() as JupiterToken[];

        this.ready = true;
    }

    async swap(inputMint: PublicKey):Promise<Transaction> {

    }

    static async build(wallet: AnchorWallet, connection: Connection): Promise<SolanaRetirement> {
        const instance = new SolanaRetirement(wallet, connection);
        await instance.init();
        return instance;
    }
}