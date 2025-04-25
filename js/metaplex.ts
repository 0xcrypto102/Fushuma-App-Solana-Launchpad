import { Connection } from '@metaplex/js';
import * as web3 from '@solana/web3.js';

import log from 'loglevel';

export class Metaplex {
    private static instance?: Metaplex;

    public static getInstance(): Metaplex {
        if (!Metaplex.instance) {
            Metaplex.instance = new Metaplex();
        }

        return Metaplex.instance;
    }

    connection?: Connection;

    constructor() {
        if (import.meta.env.VITE_BLOCKCHAIN_CONNECTION_RPC !== undefined) {
            this.connection = new Connection(import.meta.env.VITE_BLOCKCHAIN_CONNECTION_RPC);
        }
    }

    confirmTransaction = async (signature: string, onConfirmed?: () => void, onError?: () => void) => {
        let failedAttemptsCounts = 0;

        try {
            await this._confirmTransaction(signature);

            if (onConfirmed) {
                onConfirmed();
            }
        } catch (e: any) {
            log.error(e);

            failedAttemptsCounts++;

            if (failedAttemptsCounts <= 2) {
                await this._confirmTransaction(signature);
            }

            if (onError && failedAttemptsCounts > 2) {
                onError();
            }
        }
    };

    private _confirmTransaction = async (signature: string) => {
        return await this.connection?.confirmTransaction(signature, 'finalized');
    };

    getBalanceSOL = async (wallet: web3.PublicKey | null) => {
        if (!wallet) {
            throw new Error('not defined: wallet');
        } else if (!this.connection) {
            throw new Error('not defined: connection');
        }

        return await this.connection.getBalance(wallet);
    };
}
