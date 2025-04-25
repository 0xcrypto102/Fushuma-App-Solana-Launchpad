<template>
    <UApp :toaster="appConfig.toaster">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>

<script setup lang="ts">
    import { useBalanceStore } from '@/store/balances';
    import { useWallet } from 'solana-wallets-vue';
    const appConfig = useAppConfig();

    const { publicKey } = useWallet();

    const balanceStore = useBalanceStore();
    const fetchBalances = () => {
        balanceStore.clearBalances();
        balanceStore.fetchBalances();
    };

    watch(publicKey, fetchBalances);

    onMounted(async () => {
        if (publicKey) {
            fetchBalances();
        }
    });
</script>
