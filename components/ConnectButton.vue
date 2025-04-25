<template>
     <div class="relative">
        <button
            @click="connectEthereum"
            class="bg-[#da342e] hover:bg-[#df342e] text-white px-4 py-3 rounded-md font-medium"
        >
            <Icon icon="mdi:wallet" class="inline-block w-5 h-5 mr-2" />
            {{ displayText }}
        </button>

        <div
            v-if="isEvmConnected"
            class="mt-2 bg-gray-100 rounded-md px-4 py-2 text-sm text-gray-800"
        >
            <span v-if="ethAddress">EVM: {{ shortEthAddress }}</span>
            <button @click="disconnectWallet" class="ml-4 text-red-500 underline text-xs">Disconnect</button>
        </div>
    </div>

    <div
        :class="[left ? 'justify-left' : 'justify-center', hasConnectedWallet && 'flex flex-1']"
        class="parent relative duration-500 rounded-md"
    >
        <Icon name="mdi:wallet" class="mr-2 z-10 absolute left-2 -translate-y-1/2 top-1/2 text-white w-5 h-5" />

        <WalletMultiButton />
        <div
            v-if="hasConnectedWallet && balanceStore.balanceSol.fetched"
            class="flex bg-[#da342e] pl-2 pr-2 rounded-r-md -ml-1.5 z-[2] items-center"
        >
            <img :src="solanaCurrency" alt="SOL" class="h-4 bg-white p-1 md:h-5 mr-1.5 rounded-full" />
            <span
                class="text-white text-base text-ellipsis md:text-clip overflow-hidden w-12 md:whitespace-normal md:break-words md:overflow-visible md:text-sm md:w-auto mr-1.5"
            >
                {{ balanceStore.balanceSol.getFormattedAmount() }}
            </span>
        </div>
        <div
            v-else-if="hasConnectedWallet"
            class="flex bg-[#DA342E] px-2 rounded-r-md w-fit -ml-1.5 z-[2] items-center"
        >
            <AppSpinner :size="2" class="mx-4" />
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed } from 'vue';
    import { Icon } from '@iconify/vue';
    import solanaCurrency from '@/assets/img/solana.png';

    import { useBalanceStore } from '@/store/balances';
    import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
    // Props
    const ethAddress = ref<string | null>(null);

    const { publicKey, disconnect: disconnectSolana, connect: connectSolanaWallet } = useWallet();

    // Computed Values
    const solAddress = computed(() => publicKey.value?.toBase58() || null);
    const isEvmConnected = computed(() => !!ethAddress.value);
    const shortEthAddress = computed(() =>
        ethAddress.value ? `${ethAddress.value.slice(0, 6)}...${ethAddress.value.slice(-4)}` : ''
    );
    const shortSolAddress = computed(() =>
        solAddress.value ? `${solAddress.value.slice(0, 4)}...${solAddress.value.slice(-4)}` : ''
    );
    const displayText = computed(() => (isEvmConnected.value ? 'Wallet Connected' : 'Connect MetaMask'));

    // Wallet Actions
    const connectSolana = async () => {
        try {
            await connectSolanaWallet();
        } catch (err) {
            console.error('Solana connect failed:', err);
        }
    };

    const connectEthereum = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            ethAddress.value = accounts[0];
            } catch (err) {
            console.error('Ethereum connect failed:', err);
            }
        } else {
            alert('MetaMask not installed');
        }
    };

    const disconnectWallet = async () => {
        ethAddress.value = null;
        if (solAddress.value) await disconnectSolana();
    };

    defineProps<{
        left?: boolean;
    }>();
    const balanceStore = useBalanceStore();
    const hasConnectedWallet = computed(() => {
        return publicKey.value;
    });
</script>

<style>
    @media (max-width: 767px) {
        .swv-dropdown,
        .swv-button-trigger {
            width: 100%;
        }
    }

    @media (max-width: 768px) {
        .parent div:first-child {
            width: 100%;
        }
    }
</style>
