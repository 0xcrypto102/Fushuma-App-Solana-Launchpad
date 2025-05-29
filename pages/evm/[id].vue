<template>
    <div class="flex min-h-screen bg-gray-50 pt-[50px] flex-col relative items-center">
        <div class="w-full container mx-auto px-4 relative max-w-7xl">
            <AppTitle title="Token purchase" class="text-center md:text-start" />

            <div class="flex justify-center md:justify-start space-x-2 mt-6 mb-9">
                <div>
                    <UButton
                        size="lg"
                        @click="$router.push('/')"
                        icon="i-lucide-chevron-left"
                        class="text-white dark:text-white w-fit"
                    >
                        Launchpad</UButton
                    >
                </div>
                <div>
                    <UBadge
                        v-if="icoInfo.data && status"
                        :color="
                            status.color as
                                | 'primary'
                                | 'secondary'
                                | 'success'
                                | 'info'
                                | 'warning'
                                | 'error'
                                | 'neutral'
                        "
                        size="xl"
                        variant="subtle"
                        class="w-fit text-sm h-[36px] px-3"
                        >{{ status.status }}</UBadge
                    >
                </div>
            </div>
           
            <div class="flex">
                <AppStateCard v-if="!hasConnectedWallet" class="mt-6 text-center"
                    >Please connect your wallet</AppStateCard
                >
                <div v-else-if="!icoInfo.fetched" class="flex items-center justify-center w-full md:space-x-3">
                    <AppSpinner :size="4" />
                </div>

                <div v-else-if="icoInfo.data && status" class="w-full gap-3">
                    <AppBuyTokensCard
                        :ico-info="icoInfo"
                        :ico-pot="icoPot"
                        :evm-memo=true
                        :status="status.status"
                        :current-price="currentPrice"
                        @fetch:data="fetchData"
                        @fetch:purchases="fetchUserPurchases"
                    />

                    <div class="bg-white-50 mt-9 grid grid-cols-1 md:grid-cols-3 w-full gap-6 md:gap-3">
                        <AppTokensAmountCard
                            :current-price="currentPrice"
                            :ico-info="icoInfo"
                            :status="status.status"
                        />
                        <AppVestingTokensCard :ico-info="icoInfo" />
                        <AppBonusTokensCard :ico-info="icoInfo" />
                    </div>
                </div>
            </div>
          
            <div class="mt-6 flex flex-col md:flex-row gap-4">
                <!-- <UButton
                    color="error"
                    icon="i-lucide-shield"
                    @click="handleRescueTokens"
                    class="w-full md:w-auto"
                >
                    Rescue Tokens
                </UButton> -->

                <UButton
                    v-if="isOwner"
                    icon="i-lucide-check-circle"
                    @click="handleCloseICO"
                    class="text-white dark:text-white w-fit"
                >
                    Close ICO
                </UButton>
            </div>
             <div v-if="hasConnectedWallet" class="mb-12">
                <AppSubtitle title="Your purchases" class="mb-5 mt-9 text-center md:text-start" />

                <AppUserPurchasesTable
                    :user-purchases="userPurchases.data"
                    :user-purchases-fetched="userPurchases.fetched"
                    :ico="icoInfo.data"
                    @claim="claimTokens"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // import { SolanaIcoLaunchpad } from '@/js/ico';
    import { DataWrapper } from '@/types/DataWrapper';
    import { fetchICO, getMetaMaskEthereum, proxyAddress, getBuyHistory, getVestingInfoAsPurchases, proxyAsLaunchpad } from '~/js/ico-evm';
    import { type IIcoInfo, type IUserPurchaseWithKey } from '~/types/Ico';
    import AppBuyTokensCard from '~/components/AppBuyTokensCard.vue';
    import AppBonusTokensCard from '~/components/AppBonusTokensCard.vue';
    import AppVestingTokensCard from '~/components/AppVestingTokensCard.vue';
    import { getStatus, IcoStatus } from '~/js/utils';
    import { ethers } from 'ethers';
    import LaunchpadABI from '@/abis/Launchpad.json';
    import { token } from '@coral-xyz/anchor/dist/cjs/utils';
    import type { IClaimContext } from '~/components/AppUserPurchasesTable.vue';
    import VestingImplementationABI from '@/abis/VestingImplementation.json';

    const userPurchases = ref(new DataWrapper<IUserPurchaseWithKey[]>());

    const ethAddress = ref<string | null>(null);
    const owner = ref<string | null>(null);

    onMounted(async () => {
        const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        ethAddress.value = signer.address;
        console.log("eth address", ethAddress.value);

        // Load data initially
        fetchData();
       
        const metamask = getMetaMaskProvider();
        if (metamask && metamask.on) {
            metamask.on('accountsChanged', handleAccountsChanged);
            // Optional: handle network changes
            metamask.on('chainChanged', (chainId: string) => {
                console.log('[MetaMask] Chain changed:', chainId);
                window.location.reload(); // reload to reinitialize provider state
            });
        }
    });

    function getMetaMaskProvider(): any {
        const { ethereum } = window as any;
        if (!ethereum) return null;

        if (ethereum.providers?.length) {
            return ethereum.providers.find((p: any) => p.isMetaMask);
        }

        return ethereum?.isMetaMask ? ethereum : null;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
            ethAddress.value = null;
            icoInfo.value.clear();
            userPurchases.value.clear();
            return;
        }
        ethAddress.value = accounts[0];
        console.log("eth address", ethAddress.value);

        await fetchData();
    };

    const hasConnectedWallet = computed(() => {
        return ethAddress.value;
    });

    const toast = useToast();

    const icoInfo = ref(new DataWrapper<IIcoInfo>());

    const icoPot = computed(() => {
        return useRoute().params.id;
    });

    const isOwner = computed(() => {
        return (
            ethAddress.value?.toLowerCase() ===
            icoInfo.value.data?.owner?.toLowerCase()
        );
    });

    const status = computed(() => {
        if(!icoInfo.value.data) return null;

        return getStatus(
            icoInfo.value.data?.isClosed,
            icoInfo.value.data?.amount,
            icoInfo.value.data?.totalSold,
            icoInfo.value.data?.startDate.toString(),
            Date.now().toString(),
            icoInfo.value.data?.endDate.toString(),
        );
    });

    const currentPrice = ref(new DataWrapper<number>());
    const availableAmount = ref(new DataWrapper<number>());

    const fetchUserPurchases = async() => {
        try {
            if (!ethAddress.value) {
                console.error("No Ethereum address found");
                return;
            }

            if(!icoInfo.value.data) return null;

            const id = icoPot.value.toString().split("-")[1];
            const vestingContractAddress = icoInfo.value.data?.vestingContracts;
            if (!vestingContractAddress) {
                console.error("No vesting contract address found");
                return;
            }
            const data = await getVestingInfoAsPurchases(vestingContractAddress, ethAddress.value, id, icoInfo.value.data.unlockPercentage/100);
            console.log(data);
            userPurchases.value.setData(data);
        } catch (error) {
            console.error("error: ", error);
        }
    }

    const fetchCurrentPrice = async () => {
        if(!status.value) return null;
        
        if (
            (icoInfo.value.data && status.value.status === IcoStatus.Live) ||
            status.value.status === IcoStatus.Upcoming
        ) {
            const tokenSoldAmount = icoInfo.value.data?.totalSold;
            const startPrice = icoInfo.value.data?.startPrice;
            const endPrice = icoInfo.value.data?.endPrice;
            const total = icoInfo.value.data?.amount;
            
            if(Number(endPrice) == 0) {
                currentPrice.value.setData(Number(startPrice) / icoInfo.value.data!.icoDecimals);
            } else {
                if(startPrice == undefined || endPrice == undefined || tokenSoldAmount == undefined || total == undefined) return;
                // Linear increase formula (all in BigInt)
                const increase = BigInt(startPrice) + ((BigInt(endPrice) - BigInt(startPrice)) * BigInt(tokenSoldAmount)) / BigInt(total);
                // Convert BigInt to Number (only if safe to do so)
                const priceAsNumber = Number(increase) / icoInfo.value.data!.icoDecimals;
                currentPrice.value.setData(priceAsNumber);
            }
        }
    };

    const fetchData = async () => {
        if (ethAddress.value) {
            try {
                const index = icoPot.value.toString().split("-")[1];
                const i = await fetchICO(index);

                if(!i) return
                icoInfo.value.setData(i.data);

                await fetchCurrentPrice();

                // ✅ Now it's safe to call fetchUserPurchases
                await fetchUserPurchases();
            } catch (e) {
                console.log(e);
            }
        } else {
            icoInfo.value.clear();
        }
    };

    const claimTokens = async ({ userPurchaseKey, button }: IClaimContext) => {
        try {
            if(!icoInfo.value.data?.vestingContracts) return null;
            button.loading = true;
            const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
            await provider.send("eth_requestAccounts", []); // prompts MetaMask connect
            const signer = await provider.getSigner();

            console.log(icoInfo.value);
            const vesting = new ethers.Contract(icoInfo.value.data?.vestingContracts, VestingImplementationABI, signer);

            const tx = await vesting.claim(); // or .claimBehalf(user)
            await tx.wait();
        } catch (err) {
            console.error(err);
        } finally {
            button.loading = false;
        }
        };


    const handleRescueTokens = async() => {
        try {
            const tokenAddress = icoPot.value.toString().split("-")[0];
            // 1. Connect to MetaMask
            const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
            await provider.send("eth_requestAccounts", []); // prompts MetaMask connect

            // 2. Get signer
            const signer = await provider.getSigner();
            // 3. Use signer with your proxy contract
            const proxyAsLaunchpad = new ethers.Contract(proxyAddress, LaunchpadABI, signer);
            const tx = await proxyAsLaunchpad.rescueTokens(
                tokenAddress,
            );
            console.log("Transaction hash is", tx.hash);
        } catch (error) {
            console.log(error);
        }
    }

    const handleCloseICO = async() => {
        try {
            console.log("Closing ICO...")
            const id = icoPot.value.toString().split("-")[1];
            // 1. Connect to MetaMask
            const provider = new ethers.BrowserProvider(getMetaMaskEthereum());
            await provider.send("eth_requestAccounts", []); // prompts MetaMask connect

            // 2. Get signer
            const signer = await provider.getSigner();
            // 3. Use signer with your proxy contract
            const proxyAsLaunchpad = new ethers.Contract(proxyAddress, LaunchpadABI, signer);
            const tx = await proxyAsLaunchpad.closeICO(
                id,
            );
            console.log("Transaction hash is", tx.hash);
        } catch (error) {
            console.log(error)
        }
    }
</script>
