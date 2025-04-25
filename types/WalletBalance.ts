import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DataWrapper } from '@/types/DataWrapper';
import numeral from 'numeral';

export class WalletBalance extends DataWrapper<number> {
    private USDC_DECIMALS = 6;

    getUnformattedAmount() {
        return (this.data ?? 0) / LAMPORTS_PER_SOL;
    }

    getUSDCFormattedAmount() {
        return numeral((this?.data ?? 0) / Math.pow(10, this.USDC_DECIMALS)).format('0,0.00'); // Divide by 10^6 for USDC
    }

    getFormattedAmount() {
        return numeral(this.getUnformattedAmount()).format('0,0.00');
    }
}
