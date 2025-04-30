<template>
    <div class="relative inline-block w-full max-w-sm">
      <!-- Select Wallet Button -->
      <button
        @click="toggleDropdown"
        class="bg-[#da342e] hover:bg-[#c42f29] text-white px-5 py-3 rounded-md font-medium w-full flex items-center justify-center gap-2 shadow-md transition"
      >
        <Icon icon="mdi:wallet" class="w-5 h-5" />
        {{ displayText }}
      </button>
  
      <!-- Dropdown -->
      <transition name="fade">
        <div
          v-if="showDropdown"
          class="absolute mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-md z-50 overflow-hidden"
        >
            <button
                @click="selectWallet('evm')"
                class="bg-[#da342e] block  w-full text-left px-4 py-3  text-sm text-white transition rounded-md shadow-none font-[500] px-4 py-2"
            >
                Connect MetaMask
            </button>
            <div class="border-t border-gray-200"></div>
            <WalletMultiButton class="custom-solana-button" />

        </div>
      </transition>
  
      <!-- Connected Wallet Info -->
      <div
        v-if="isEvmConnected || hasConnectedWallet"
        class="mt-3 bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 space-y-1"
      >
        <div v-if="isEvmConnected">🟢 EVM: {{ shortEthAddress }}</div>
        <div v-if="hasConnectedWallet">🟣 Solana: {{ shortSolAddress }}</div>
        <button
          @click="disconnectWallet"
          class="text-red-500 hover:underline text-xs font-medium"
        >
          Disconnect
        </button>
      </div>
    </div>
</template>
<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Icon } from '@iconify/vue';
  import { useWallet, WalletMultiButton } from 'solana-wallets-vue';
  import { useBalanceStore } from '@/store/balances';
  
  const showDropdown = ref(false);
  const toggleDropdown = () => (showDropdown.value = !showDropdown.value);
  
  const ethAddress = ref<string | null>(null);
  const { publicKey, disconnect: disconnectSolana, connect: connectSolanaWallet } = useWallet();
  
  const solAddress = computed(() => publicKey.value?.toBase58() || null);
  const isEvmConnected = computed(() => !!ethAddress.value);
  const hasConnectedWallet = computed(() => !!solAddress.value);
  
  const shortEthAddress = computed(() =>
    ethAddress.value ? `${ethAddress.value.slice(0, 6)}...${ethAddress.value.slice(-4)}` : ''
  );
  const shortSolAddress = computed(() =>
    solAddress.value ? `${solAddress.value.slice(0, 4)}...${solAddress.value.slice(-4)}` : ''
  );
  
  const displayText = computed(() => {
    if (isEvmConnected.value) return 'MetaMask Connected';
    if (hasConnectedWallet.value) return 'Solana Connected';
    return 'Select Wallet';
  });
  
    function getMetaMaskProvider(): any {
        const { ethereum } = window as any;

        // If multiple providers exist (MetaMask + Phantom)
        if (ethereum?.providers?.length) {
            return ethereum.providers.find((p: any) => p.isMetaMask);
        }

        // Fallback: single injected provider
        if (ethereum?.isMetaMask) return ethereum;

        throw new Error('MetaMask provider not found');
    }

    const selectWallet = async (type: 'evm' | 'solana') => {
        showDropdown.value = false;

        if (type === 'evm') {
            try {
            const metamask = getMetaMaskProvider();
            const accounts = await metamask.request({ method: 'eth_requestAccounts' });
            ethAddress.value = accounts[0];
            // You can now use `metamask` as your provider in ethers:
            // const provider = new ethers.BrowserProvider(metamask);
            } catch (err) {
            console.error('MetaMask connect failed:', err);
            }
        } else if (type === 'solana') {
            try {
            await connectSolanaWallet();
            } catch (err) {
            console.error('Solana connect failed:', err);
            }
        }
    };
  
  const disconnectWallet = async () => {
    ethAddress.value = null;
    if (solAddress.value) await disconnectSolana();
  };
  
  const balanceStore = useBalanceStore();
</script>
  
<style scoped>
.custom-solana-button {
  background-color: white !important;
  color: #333 !important;
  padding: 0.5rem 1rem !important;
  border-radius: 6px !important;
  font-weight: 500;
  width: 100% !important;
  text-align: left !important;
  transition: background-color 0.2s ease;
}

.custom-solana-button:hover {
  background-color: #f3f4f6 !important;
}
</style>

