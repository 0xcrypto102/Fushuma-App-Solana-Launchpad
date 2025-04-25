import { Metaplex } from '@/js/metaplex';
import log from 'loglevel';
import { defineStore } from 'pinia';
import { useWallet } from 'solana-wallets-vue';
import { WalletBalance } from '~/types/WalletBalance';

export const useBalanceStore = defineStore('balances', {
    state: () => ({
        balanceSol: new WalletBalance(),
    }),

    actions: {
        clearBalances() {
            this.balanceSol.clear();
        },

        async fetchBalances() {
            const { publicKey } = useWallet();

            if (!publicKey.value) {
                log.info('not defined: publicKey.value');
                return;
            }

            try {
                const sol = await Metaplex.getInstance().getBalanceSOL(publicKey.value);

                if (sol !== null) {
                    this.balanceSol.setData(sol);
                } else {
                    this.balanceSol.setError();
                }
            } catch (e: any) {
                log.error(e);
                this.balanceSol.setError(e);
            }
        },
    },
});
