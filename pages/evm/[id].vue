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
                        v-if="icoInfo.data"
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

            <!-- <div class="bg-white p-4 shadow-sm mb-9" v-if="launchpadData">
                <div class="flex flex-col md:flex-row justify-between items-center md:items-start">
                    <div class="flex items-center mb-4 md:mb-0">
                        <div v-if="launchpadData.projectLogo" class="mr-2">
                            <img
                                :src="launchpadData.projectLogo"
                                alt="Project Logo"
                                class="w-8 h-8 rounded-full object-contain"
                            />
                        </div>
                        <div>
                            <h2 class="text-xl font-bold expletus">{{ launchpadData.name }}</h2>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <a
                            v-if="launchpadData.links?.web"
                            :href="launchpadData.links.web.url"
                            target="_blank"
                            class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                        >
                            <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                        </a>
                        <a
                            v-if="launchpadData.links?.x"
                            :href="launchpadData.links.x.url"
                            target="_blank"
                            class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                        >
                            <UIcon name="simple-icons:x" class="w-4 h-4" />
                        </a>
                        <a
                            v-if="launchpadData.links?.telegram"
                            :href="launchpadData.links.telegram.url"
                            target="_blank"
                            class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                        >
                            <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
                        </a>
                    </div>
                </div>
                <div class="text-sm text-gray-500 pt-2">{{ launchpadData.description }}</div>
            </div> -->

            <div class="flex">
                <AppStateCard v-if="!hasConnectedWallet" class="mt-6 text-center"
                    >Please connect your wallet</AppStateCard
                >
                <div v-else-if="!icoInfo.fetched" class="flex items-center justify-center w-full md:space-x-3">
                    <AppSpinner :size="4" />
                </div>

                <div v-else-if="icoInfo.data" class="w-full gap-3">
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
            <!-- <div v-if="hasConnectedWallet" class="mb-12">
                <AppSubtitle title="Your purchases" class="mb-5 mt-9 text-center md:text-start" />

                <AppUserPurchasesTable
                    :user-purchases="userPurchases.data"
                    :user-purchases-fetched="userPurchases.fetched"
                    :ico="icoInfo.data"
                    @claim="claimTokens"
                />
            </div> -->
        </div>
    </div>
</template>

<script setup lang="ts">
    // import { SolanaIcoLaunchpad } from '@/js/ico';
    import { DataWrapper } from '@/types/DataWrapper';
    import { fetchICO, launchpad } from '~/js/ico-evm';
    import { type IIcoInfo, type IUserPurchaseWithKey } from '~/types/Ico';
    import AppUserPurchasesTable, { type IClaimContext } from '~/components/AppUserPurchasesTable.vue';
    import AppBuyTokensCard from '~/components/AppBuyTokensCard.vue';
    import AppBonusTokensCard from '~/components/AppBonusTokensCard.vue';
    import AppVestingTokensCard from '~/components/AppVestingTokensCard.vue';
    import { Metaplex } from '~/js/metaplex';
    import { getStatus, IcoStatus } from '~/js/utils';
    // import launchpads from '@/assets/launchpads.json';

    // const { publicKey } = useWallet();

    const ethAddress = ref<string | null>(null);
    onMounted(async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        ethAddress.value = accounts[0];
        fetchData();
        fetchUserPurchases();
    });

    const hasConnectedWallet = computed(() => {
        return ethAddress.value;
    });

    const toast = useToast();

    const icoInfo = ref(new DataWrapper<IIcoInfo>());
    // const userPurchases = ref(new DataWrapper<IUserPurchaseWithKey[]>());

    const icoPot = computed(() => {
        return useRoute().params.id;
    });

    // // Find the matching launchpad data from launchpads.json
    // const launchpadData = computed(() => {
    //     return launchpads.find((launchpad) => launchpad.key === icoPot.value);
    // });

    const status = computed(() => {
        return getStatus(
            icoInfo.value.data?.isClosed,
            icoInfo.value.data?.amount,
            icoInfo.value.data?.totalSold,
            icoInfo.value.data?.startDate,
            Date.now(),
            icoInfo.value.data?.endDate,
        );
    });

    const currentPrice = ref(new DataWrapper<number>());
    const availableAmount = ref(new DataWrapper<number>());

    const fetchCurrentPrice = async () => {
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
                const increasePrice = startPrice + (endPrice - startPrice) * tokenSoldAmount / total;
                currentPrice.value.setData(Number(increasePrice) / icoInfo.value.data!.icoDecimals);
            }
        }
    };

    const fetchUserPurchases = async () => {
        if (ethAddress.value) {
            try {
                // const ups = await SolanaIcoLaunchpad.getAllPurchases({
                //     buyer: new web3.PublicKey(publicKey.value.toBase58()),
                //     ico: new web3.PublicKey(icoPot.value),
                // });

                // ups.forEach((up: IUserPurchaseWithKey) => {
                //     up.data.buyDate *= 1000;
                // });

                // ups.sort((a, b) => (a.data.buyDate > b.data.buyDate ? -1 : 1));

                // userPurchases.value.setData(ups);
            } catch (e) {
                console.log(e);
            }
        } else {
            // userPurchases.value.clear();
        }
    };


    // watch(
    //     () => publicKey.value,
    //     () => {
    //         fetchData();
    //         fetchUserPurchases();
    //     },
    // );

    const fetchData = async () => {
        if (ethAddress.value) {
            try {
                const index = icoPot.value.toString().split("-")[1];
                const i = await fetchICO(launchpad, index);

                if(!i) return
                icoInfo.value.setData(i.data);

                await fetchCurrentPrice();
            } catch (e) {
                console.log(e);
            }
        } else {
            icoInfo.value.clear();
        }
    };

    const claimTokens = async (context: IClaimContext) => {
        context.button.loading = true;

        // try {
        //     toast.add({
        //         title: 'Preparing transaction',
        //         icon: 'i-lucide-info',
        //         description: 'Please wait for the transaction.',
        //         color: 'info',
        //     });

        //     const txSig = await SolanaIcoLaunchpad.claimTokens({
        //         icoPot: new web3.PublicKey(icoPot.value),
        //         isIco2022: false, //TODO where can we take this?
        //         userPurchase: new web3.PublicKey(context.userPurchaseKey),
        //     });

        //     toast.add({
        //         title: 'Confirming transaction',
        //         icon: 'i-lucide-info',
        //         description: 'Please wait for the transaction.',
        //         color: 'info',
        //     });

        //     await Metaplex.getInstance().confirmTransaction(txSig);

        //     toast.add({
        //         title: 'Success',
        //         icon: 'i-lucide-check-circle',
        //         description: 'Your action was completed successfully.',
        //         color: 'success',
        //     });

        //     // await fetchUserPurchases();
        // } catch (e) {
        //     toast.add({
        //         title: 'Uh oh! Something went wrong.',
        //         description: 'There was a problem with your request.',
        //         icon: 'i-lucide-alert-circle',
        //         close: {
        //             color: 'primary',
        //             variant: 'outline',
        //             class: 'rounded-full',
        //         },
        //     });
        // } finally {
        //     context.button.loading = false;
        // }
    };
</script>
