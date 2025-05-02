<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Create ICO</h1>

    <div v-if="!ethAddress" class="text-red-600">Please connect your wallet to continue.</div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium">Token Address</label>
          <input v-model="icoForm.token" type="text" class="input" placeholder="0x..."  className="border border-gray-300 p-2 rounded-md w-full" />
        </div>

        <div>
          <label class="block font-medium">Payment Token (0x0 for ETH)</label>
          <input v-model="icoForm.paymentToken" type="text" class="input" placeholder="0x... or 0x0" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Amount (in Tokens)</label>
          <input v-model="icoForm.amount" type="text" class="input" placeholder="e.g. 1000000" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Bonus Reserve</label>
          <input v-model="icoForm.bonusReserve" type="text" class="input" placeholder="e.g. 100000" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Start Price (in ETH)</label>
          <input v-model="icoForm.startPrice" type="text" class="input" placeholder="e.g. 0.01" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">End Price (0 for fixed)</label>
          <input v-model="icoForm.endPrice" type="text" class="input" placeholder="e.g. 0" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Start Date (UNIX timestamp)</label>
          <input v-model="icoForm.startDate" type="number" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">End Date (0 for unlimited)</label>
          <input v-model="icoForm.endDate" type="number" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Bonus Percentage (e.g. 2500 for 25%)</label>
          <input v-model="icoForm.bonusPercentage" type="text" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Bonus Activator (e.g. 1000 for 10%)</label>
          <input v-model="icoForm.bonusActivator" type="text" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Unlock Percentage (e.g. 5000 = 50%)</label>
          <input v-model="icoForm.unlockPercentage" type="text" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Cliff Period (seconds)</label>
          <input v-model="icoForm.cliffPeriod" type="number" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Vesting Percentage (e.g. 1000 = 10%)</label>
          <input v-model="icoForm.vestingPercentage" type="text" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>

        <div>
          <label class="block font-medium">Vesting Interval (seconds)</label>
          <input v-model="icoForm.vestingInterval" type="number" class="input" className="border border-gray-300 p-2 rounded-md w-full"/>
        </div>
      </div>

      <button @click="createICO" class="bg-green-600 text-white px-4 py-2 rounded-md">
        Create ICO
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Web3 from 'web3';
  import { ref, onMounted } from 'vue';
  import LaunchpadABI from '@/abis/Launchpad.json';
  import ERC20ABI from '@/abis/ERC20.json';
  import { proxyAddress, getMetaMaskEthereum } from '~/js/ico-evm';
  import { ethers } from 'ethers';
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const web3 = new Web3(window.ethereum);
  // const tokenAddress = '0x24Eb18b226e41D1186955A95EAe81b2d9Efd731D';
  const ethAddress = ref<string | null>(null);
  const icoForm = ref({
    token: '',
    paymentToken: '0x0000000000000000000000000000000000000000',
    amount: '',
    startPrice: '',
    endPrice: '0',
    startDate: Math.floor(Date.now() / 1000) + 3600,
    endDate: 0,
    bonusReserve: '',
    bonusPercentage: '',
    bonusActivator: '',
    unlockPercentage: '',
    cliffPeriod: 60 * 60 * 24 * 30,
    vestingPercentage: '',
    vestingInterval: 60 * 60 * 24 * 30
  });


  onMounted(async () => {
    const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
    await provider.send("eth_requestAccounts", []); // prompts MetaMask connect
    const signer = await provider.getSigner();
    ethAddress.value = signer.address;
  });

  const approveToken = async () => {
    try {
      if(!ethAddress.value) return
      const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
      await provider.send("eth_requestAccounts", []); // prompts MetaMask connect
      const signer = await provider.getSigner();
      const token = new ethers.Contract(icoForm.value.token, ERC20ABI, signer);
      const total = web3.utils.toWei((Number(icoForm.value.amount) + Number(icoForm.value.bonusReserve)).toString(), 'ether');

      const tx = await token.approve(proxyAddress, total);
      const result = await tx.wait();
      if (result) {
        return result
      }
    } catch (error) {
      console.log("error: error");
    }
  };

  const createICO = async () => {
    try {
      if(!ethAddress.value) return
      const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
      console.log(provider);
      await provider.send("eth_requestAccounts", []); // prompts MetaMask connect
      const signer = await provider.getSigner();

      const proxyAsLaunchpad = new ethers.Contract(proxyAddress, LaunchpadABI, signer);
      
      await approveToken();

      const icoParams = {
        token: icoForm.value.token,
        paymentToken: icoForm.value.paymentToken,
        amount: (web3.utils.toWei(icoForm.value.amount, 'ether')),
        startPrice: (web3.utils.toWei(icoForm.value.startPrice, 'ether')),
        endPrice: (web3.utils.toWei(icoForm.value.endPrice, 'ether')),
        startDate: +icoForm.value.startDate,
        endDate: +icoForm.value.endDate,
        bonusReserve: (web3.utils.toWei(icoForm.value.bonusReserve, 'ether')),
        bonusPercentage: +icoForm.value.bonusPercentage,
        bonusActivator: +icoForm.value.bonusActivator,
        vestingParams: {
          unlockPercentage: +icoForm.value.unlockPercentage,
          cliffPeriod: +icoForm.value.cliffPeriod,
          vestingPercentage: +icoForm.value.vestingPercentage,
          vestingInterval: +icoForm.value.vestingInterval
        }
      };
      console.log(icoParams);
    
      const tx = await proxyAsLaunchpad.createICO(icoParams);
      console.log("transaction hash is ", tx);
      if ( await tx.wait()) {
        router.push('/')
      }
    } catch (err:any) {
      console.error("Create ICO failed:", err);
      alert("Create ICO failed: " + (err.message || "Unknown error"));
    }
  };
</script>
