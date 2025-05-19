<template>
  <!-- Connect Wallet Button -->
  <button
    @click="showModal = true"
    class="bg-[#da342e] hover:bg-[#c42f29] text-white px-5 py-3 rounded-md font-medium flex items-center gap-2 shadow-md transition"
  >
    <Icon icon="mdi:wallet" class="w-5 h-5" />
    <span>
      {{ shortEthAddress || shortSolAddress || 'Connect Wallet' }} {{walletType.value}}
    </span>
  </button>

  <!-- Wallet Modal -->
  <div v-if="showModal" class="fixed inset-0 z-50 flex justify-center items-center">
    <!-- Semi-transparent white background -->
    <div class="absolute inset-0 backdrop-blur-sm"></div>

    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md z-10">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4">
        <h2 class="text-lg font-semibold">Connect Wallet</h2>
        <button @click="showModal = false" class="text-gray-500 text-xl hover:text-gray-700">&times;</button>
      </div>

      <!-- Wallet Options -->
      <div class="p-4 space-y-2">
        <!-- Detected Wallets -->
        <div v-for="wallet in detectedWallets" :key="wallet.name">
          <button
            @click="selectWallet(wallet.type)"
            class="flex items-center justify-between w-full px-4 py-2 text-sm  rounded-md hover:bg-gray-100"
          >
            <span>{{ wallet.name }}</span>
            <span class="text-green-600 text-xs font-medium">Detected</span>
          </button>
        </div>

        <!-- Toggle More Options -->
        <div v-if="!showAllWallets">
          <button
            @click="showAllWallets = true"
            class="text-sm text-blue-500 hover:underline mt-2"
          >
            More options
          </button>
        </div>

        <!-- Undetected Wallets -->
        <div v-if="showAllWallets" class="space-y-2">
          <div v-for="wallet in undetectedWallets" :key="wallet.name">
            <button
              disabled
              class="flex items-center justify-between w-full px-4 py-2 text-sm rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
            >
              <span>{{ wallet.name }}</span>
              <span class="text-xs">Not Detected</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useWallet } from 'solana-wallets-vue';

const showModal = ref(false);
const showAllWallets = ref(false);
const walletType = ref<string>("evm");
const ethAddress = ref<string | null>(null);
const solAddress = ref<string | null>(null);

const { publicKey, connect: connectSolanaWallet } = useWallet();

// Shortened display
const shortEthAddress = computed(() =>
  (ethAddress.value && walletType.value == "evm") ? `EVM ${ethAddress.value.slice(0, 6)}...${ethAddress.value.slice(-4)}` : ''
);
const shortSolAddress = computed(() =>
  (solAddress.value && walletType.value == "solana") ? `Solana ${solAddress.value.slice(0, 4)}...${solAddress.value.slice(-4)}` : ''
);

// Detection
const metaMaskDetected = computed(() => {
  const { ethereum } = window as any;
  if (ethereum?.providers?.length) {
    return ethereum.providers.some((p: any) => p.isMetaMask);
  }
  return !!ethereum?.isMetaMask;
});

const phantomDetected = computed(() => {
  const { solana } = window as any;
  return !!solana?.isPhantom;
});

const detectedWallets = computed(() => {
  const wallets = [];
  if (metaMaskDetected.value) wallets.push({ name: 'MetaMask', type: 'evm' });
  if (phantomDetected.value) wallets.push({ name: 'Phantom', type: 'solana' });
  return wallets;
});

const undetectedWallets = computed(() => {
  const all = [
    { name: 'MetaMask', type: 'evm' },
    { name: 'Phantom', type: 'solana' },
    { name: 'Solflare', type: 'solana' },
    { name: 'Backpack', type: 'solana' }
  ];
  return all.filter(
    (w) => !detectedWallets.value.some((d) => d.name === w.name)
  );
});

// Connect wallet
const selectWallet = async (type: 'evm' | 'solana') => {
  showModal.value = false;
  if (type === 'evm') {
    try {
      const ethereum = (window as any).ethereum;
      const provider = ethereum?.providers?.find((p: any) => p.isMetaMask) || ethereum;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      ethAddress.value = accounts[0];
      walletType.value = "evm";
    } catch (err) {
      alert('MetaMask connect failed.');
    }
  } else if (type === 'solana') {
    try {
      const { solana } = window as any;
      await solana.connect();
      console.log('Connected Solana wallet:', solana.publicKey.toString());
      solAddress.value = solana.publicKey.toString(); // manually assign
      walletType.value = "solana"
    } catch (err) {
      alert('Solana connect failed.');
    }
  }
};

</script>
