import { defineNuxtPlugin } from '#app';
import 'solana-wallets-vue/styles.css';

import {
    CloverWalletAdapter,
    MathWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import SolanaWallets from 'solana-wallets-vue';

function isMobileSafari() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) && !/CriOS/i.test(userAgent);
    return isIOS && isSafari;
}

function isMobileChrome() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && /Mobile/i.test(userAgent);
    return isAndroid && isChrome;
}

export default defineNuxtPlugin((nuxtApp) => {
    const autoConnect = !(isMobileSafari() || isMobileChrome());

    const walletOptions = {
        wallets: [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new MathWalletAdapter(),
            new CloverWalletAdapter(),
        ],
        autoConnect,
    };

    nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});
