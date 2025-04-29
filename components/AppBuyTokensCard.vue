<script setup lang="ts">
    import type { IIcoInfoWithKey } from '~/types/Ico';
    import { SolanaIcoLaunchpad } from '~/js/ico';
    import * as web3 from '@solana/web3.js';
    import { Metaplex } from '~/js/metaplex';
    import { useBalanceStore } from '@/store/balances';
    import { IcoStatus } from '~/js/utils';
    import { convertTokenIfAvailableWithFormatting } from '~/js/tokens';
    import type { DataWrapper } from '~/types/DataWrapper';
    import { evmBuyToken, getEvmCostInfo, launchpad, launchpadAddress } from '~/js/ico-evm';
    import Web3 from 'web3';
    import { ethers } from 'ethers';
    import LaunchpadABI from '@/abis/Launchpad.json';

    const evmWeb3 = new Web3(window.ethereum);
    const balanceStore = useBalanceStore();

    const fetchBalances = () => {
        balanceStore.clearBalances();
        balanceStore.fetchBalances();
    };

    const toast = useToast();

    const { icoInfo, icoPot, evmMemo, currentPrice } = defineProps<{
        icoInfo: IIcoInfoWithKey;
        icoPot: string;
        evmMemo?: boolean;
        status: IcoStatus;
        currentPrice: DataWrapper<number>;
    }>();

    const emits = defineEmits<{
        (e: 'fetch:data'): void;
        (e: 'fetch:purchases'): void;
    }>();

    const isLoading = ref();
    const isPriceLoading = ref();
    const isSetPurchasePrice = ref<boolean>(true);

    const purchaseAmount = ref<number>();
    const purchasePrice = ref<number>();

    const evmChainAddress = ref<string>('');

    const price = ref({
        value: 0,
        availableAmount: 0,
    });

    const minTokenAmount = computed(() => {
        if (!icoInfo.data) return 0.01;
        return 1 / icoInfo.data!.icoDecimals;
    });

    const bonusProgressValue = computed(() => {
        if (isSetPurchasePrice) {
            if (!icoInfo.data || !price.value?.availableAmount || !tokensToPurchase.value) return 0;
            const bonusAmount = Math.min(price.value.availableAmount * (icoInfo.data.bonusPercentage / 100 / 100),
                icoInfo.data.bonusReserve / icoInfo.data.icoDecimals
            )
            const maxAmount = icoInfo.data.bonusReserve / icoInfo.data.icoDecimals;
            
            return Math.min((bonusAmount / maxAmount) * 100, 100);
        } else {
            if (!icoInfo.data || !purchaseAmount.value || !tokensToPurchase.value) return 0;
            const bonusAmount = Math.min(purchaseAmount.value * (icoInfo.data.bonusPercentage / 100 / 100),
                icoInfo.data.bonusReserve / icoInfo.data.icoDecimals
            )
            const maxAmount = icoInfo.data.bonusReserve / icoInfo.data.icoDecimals;

            return Math.min((bonusAmount / maxAmount) * 100, 100);
        }
    });

    const getPrice = async (tokensAmount?: number) => {
        if (tokensAmount) {
            isPriceLoading.value = true;

            try {
                if (evmMemo) {
                    const id = icoPot.split("-")[1];
                    const decimals = BigInt(icoInfo.data!.icoDecimals);
                    const amount = BigInt(tokensAmount) * decimals;
                    const p = await getEvmCostInfo(launchpad, Number(id), amount);

                    if (!p) throw new Error("Failed to fetch EVM cost info");
                    if(!id && Number(id) <0 ) return null;
                        if(tokensAmount <= 0) return null;

                    price.value = {
                        availableAmount: Number(p.availableAmount) / icoInfo.data!.icoDecimals,
                        value: Number(p.value) / icoInfo.data!.icoDecimals,
                    };

                    // purchaseAmount.value = p.availableAmount;
                    // purchasePrice.value = p.value;
                } else {
                    const p = await SolanaIcoLaunchpad.getPurchaseAmount({
                        icoPot: new web3.PublicKey(icoPot),
                        amount: Number(tokensAmount * icoInfo.data!.icoDecimals),
                    });

                    price.value = {
                        availableAmount: p.availableAmount / icoInfo.data!.icoDecimals,
                        value: p.value / icoInfo.data!.icoDecimals,
                    };

                    purchaseAmount.value = price.value.availableAmount;
                    purchasePrice.value = price.value.value;
                }
                
            } finally {
                isPriceLoading.value = false;
            }
        }
    };

    // const onPurchasePriceChange = (value: number | null) => {
    //     console.log("value", value);
    //     purchasePrice.value = value;
    //     console.log("purchasePrice.value", purchasePrice.value);
    // };

    watch(purchaseAmount, () => getPrice(purchaseAmount.value), { immediate: true });

    watch(
        purchasePrice,
        () => {
            if (purchasePrice.value && currentPrice.data) {
                const totalPriceDecimals = purchasePrice.value;
                const tokensAmount = Math.round(totalPriceDecimals / currentPrice.data);

                price.value.availableAmount = tokensAmount;
                price.value.value = purchasePrice.value;
                console.log(price.value.availableAmount);

                // getPrice(tokensAmount);
            }
        },
        { immediate: true },
    );

    const buy = async () => {
        if (!price.value.availableAmount) return;

        isLoading.value = true;

        try {
            if(evmMemo) {
                const id = icoPot.split("-")[1];
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                // Send the transaction with the correct parameters
                try {
                    const gasPrice = await evmWeb3.eth.getGasPrice();
                    // Calculate the value to send with the transaction
                    console.log(price.value,"sdfsdf");
                    const valueToSend = evmWeb3.utils.toWei(price.value.value, 'ether');
                    // Estimate gas without including 'value' in the function arguments
                    const amountToBuy = evmWeb3.utils.toWei(price.value.availableAmount, 'ether');
                    const buyerAddress = account;
                    const { availableAmount, value: amountToPay } = await launchpad.methods.getValue(id, amountToBuy).call();

                    const { startDate, endDate } = await launchpad.methods.icoParams(id).call();
                    const { isClosed } = await launchpad.methods.icoState(id).call();
                    const now = Math.floor(Date.now() / 1000); // current timestamp

                    if (now < startDate) {
                        console.error('ICO is not started yet');
                    }
                    if (Number(endDate) !== 0 && now > endDate) {
                        console.error('ICO already finished');
                    }
                    if (isClosed) {
                        console.error('ICO is closed');
                    }

                    const estimatedGas = await launchpad.methods.buyToken(id, amountToBuy, buyerAddress).estimateGas({
                        from: buyerAddress,
                        value: amountToPay
                    });

                    const tx = await launchpad.methods.buyToken(
                        id,
                        amountToBuy,
                        buyerAddress
                    ).send({
                        from: buyerAddress,
                        value: amountToPay,  
                        gasPrice: gasPrice,
                        gas: Math.floor(estimatedGas * 1.2)
                    });
                    console.log("Transaction hash is ", tx);
                } catch (error) {
                    console.log("error", error);
                }
            } else {
                toast.add({
                    title: 'Preparing transaction',
                    icon: 'i-lucide-info',
                    description: 'Please wait for the transaction.',
                    color: 'info',
                });

                const txSig = await SolanaIcoLaunchpad.buyToken({
                    icoPot: new web3.PublicKey(icoPot),
                    evmChainAddress: evmMemo ? evmChainAddress.value : undefined,
                    amountWithDecimals: price.value.availableAmount * icoInfo.data!.icoDecimals,
                });

                toast.add({
                    title: 'Confirming transaction',
                    icon: 'i-lucide-info',
                    description: 'Please wait for the transaction.',
                    color: 'info',
                });

                if (txSig) {
                    await Metaplex.getInstance().confirmTransaction(txSig);
                }

                toast.add({
                    title: 'Success',
                    icon: 'i-lucide-check-circle',
                    description: 'Your action was completed successfully.',
                    color: 'success',
                });

                emits('fetch:data');
                emits('fetch:purchases');
                fetchBalances();
                getPrice();
                resetValues();
            }
        } catch (e) {
            toast.add({
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with your request.',
                icon: 'i-lucide-alert-circle',
                close: {
                    color: 'primary',
                    variant: 'outline',
                    class: 'rounded-full',
                },
            });
        } finally {
            isLoading.value = false;
        }
    };

    const tokensToPurchase = computed(() => {
        return (icoInfo.data.amount / icoInfo.data.icoDecimals) * (icoInfo.data?.bonusActivator / 100 / 100);
    });

    const isStableSale = computed(() => {
        return icoInfo.data.endPrice == BigInt(0);
    });

    const resetValues = () => {
        purchaseAmount.value = undefined;
        purchasePrice.value = undefined;
        price.value.availableAmount = 0;
        price.value.value = 0;
    };
</script>

<template>
    <div class="bg-white shadow-sm py-6 px-4 space-y-3">
        <AppSubtitle class="mb-5" title="Buy token" />

        <p v-if="isStableSale" class="text-sm mb-6 text-black/60 dark:text-white/50">
            Please specify the amount of tokens you wish to purchase or the buy amount.
        </p>
        <p v-else class="text-sm text-black/60 mb-6 dark:text-white/50">
            Please specify the amount of tokens you wish to purchase. Buy amount is not available for dynamic token
            prices.
        </p>

        <div
            v-if="status === IcoStatus.SoldOut"
            class="text-sm text-white bg-gradient-to-r mt-3 flex items-center space-x-1.5 -mx-4 from-primary-500 via-transparent to-transparent py-3 px-6 font-bold"
        >
            <Icon name="lucide:octagon-x" class="text-white text-xl w-4 h-4" />
            <span>Tokens are sold out</span>
        </div>

        <div
            v-else-if="status === IcoStatus.Ended"
            class="text-sm text-white bg-gradient-to-r mt-3 flex items-center space-x-1.5 -mx-4 from-primary-500 to-white py-3 px-6 font-bold"
        >
            <Icon name="lucide:octagon-x" class="text-white text-xl w-4 h-4" />
            <span>Sale has ended</span>
        </div>

        <div
            v-else-if="status === IcoStatus.Upcoming"
            class="text-sm text-white bg-gradient-to-r mt-3 flex items-center space-x-1.5 -mx-4 from-primary-500 to-white py-3 px-6 font-bold"
        >
            <Icon name="lucide:octagon-x" class="text-white text-xl w-4 h-4" />
            <span>Sale has not started yet</span>
        </div>

        <div
            v-else-if="status === IcoStatus.Closed"
            class="text-sm text-white bg-gradient-to-r mt-3 flex items-center space-x-1.5 -mx-4 from-primary-500 to-white py-3 px-6 font-bold"
        >
            <Icon name="lucide:octagon-x" class="text-white text-xl w-4 h-4" />
            <span>Sale is closed</span>
        </div>

        <div v-else>
            <div v-if="isStableSale" class="border py-1.5 px-4 -mx-4 border-gray-100 flex items-center my-6">
                <p class="text-sm mr-3 block font-medium text-(--ui-text)">Buy Amount</p>
                <USwitch v-model="isSetPurchasePrice" @update:model-value="resetValues" label="Pay Amount" />
            </div>

            <div class="w-full md:items-end md:grid flex max-w-2/3 flex-col grid-cols-3 gap-3">
                <UFormField v-if="isSetPurchasePrice" label="Pay Amount" required number>
                    <UInputNumber v-if="!evmMemo"
                        class="w-full"
                        :step="minTokenAmount"
                        :min="minTokenAmount"
                        v-model="purchasePrice"
                        :format-options="{
                            maximumFractionDigits: 9,
                        }"
                    >
                        <template #decrement>
                            <span />
                        </template>
                        <template #increment>
                            <span class="px-1">{{ convertTokenIfAvailableWithFormatting(icoInfo.data.costMint) }}</span>
                        </template>
                    </UInputNumber>

                    <UInputNumber v-if="evmMemo" 
                    :step="0.01"
                    :min="0"
                    class="w-full" 
                    type="number" 
                    v-model="purchasePrice">
                        <template #decrement>
                            <span />
                        </template>
                        <template #increment>
                            <span class="px-1">{{ convertTokenIfAvailableWithFormatting(icoInfo.data.costMint) }}</span>
                        </template>
                    </UInputNumber>
                </UFormField>

                <UFormField v-if="isSetPurchasePrice" label="You Receive">
                    <UInputNumber
                        class="w-full text-center"
                        :format-options="{
                            roundingMode: 'expand',
                            roundingPriority: 'morePrecision',
                        }"
                        variant="subtle"
                        readonly
                        v-model="price.availableAmount"
                    >
                        <template #decrement>
                            <span />
                        </template>
                        <template #increment>
                            <AppSpinner v-if="isPriceLoading" :size="2" class="ml-2" />
                            <span v-else class="px-1">{{
                                convertTokenIfAvailableWithFormatting(icoInfo.data.icoMint)
                            }}</span>
                        </template>
                    </UInputNumber>
                </UFormField>

                <UFormField v-if="!isSetPurchasePrice" label="Buy Amount" required number>
                    <UInputNumber class="w-full" type="number" v-model="purchaseAmount">
                        <template #decrement>
                            <span />
                        </template>
                        <template #increment>
                            <span class="px-1">{{ convertTokenIfAvailableWithFormatting(icoInfo.data.icoMint) }}</span>
                        </template>
                    </UInputNumber>
                </UFormField>

                <UFormField v-if="!isSetPurchasePrice" label="You Pay">
                    <UInputNumber
                        class="w-full text-center"
                        :format-options="{
                            roundingMode: 'expand',
                            roundingPriority: 'morePrecision',
                        }"
                        variant="subtle"
                        readonly
                        v-model="price.value"
                    >
                        <template #decrement>
                            <span />
                        </template>
                        <template #increment>
                            <AppSpinner v-if="isPriceLoading" :size="2" class="ml-2" />
                            <span v-else class="px-1">{{
                                convertTokenIfAvailableWithFormatting(icoInfo.data.costMint)
                            }}</span>
                        </template>
                    </UInputNumber>
                </UFormField>
                <UFormField v-if="evmMemo" required label="EVM Chain Address">
                    <UInput class="w-full text-center" v-model="evmChainAddress" />
                </UFormField>
                <!-- <UButton
                    :class="!purchaseAmount || (isLoading && 'cursor-not-allowed')"
                    :loading="isLoading"
                    class="w-fit max-h-[48px] h-[36px] px-6 dark:text-white"
                    :disabled="
                        (isSetPurchasePrice ? !purchasePrice : !purchaseAmount) ||
                        isLoading ||
                        (evmMemo && evmChainAddress === '')
                    "
                    @click="buy"
                    >Buy token</UButton
                > -->
                <UButton
                    :class="!purchaseAmount || (isLoading && 'cursor-not-allowed')"
                    :loading="isLoading"
                    class="w-fit max-h-[48px] h-[36px] px-6 dark:text-white"
                    @click="buy"
                    >Buy token</UButton
                >
            </div>
        </div>

        <div
            v-if="status === IcoStatus.Live && icoInfo.data?.bonusReserve && icoInfo.data.bonusReserve > 0"
            class="mt-6 w-full md:w-1/2"
        >
            <p class="text-sm text-black/60 dark:text-white/50 mb-2">Bonus activation progress</p>
            <UProgress v-model="bonusProgressValue" />
            <div v-if="isSetPurchasePrice">
                <!-- <p v-if="!price.value.availableAmount || price.value.availableAmount < tokensToPurchase" class="text-sm mt-2 text-primary-500"> -->
                <p v-if="!price.availableAmount || price.availableAmount < tokensToPurchase" class="text-sm mt-2 text-primary-500">
                    You need
                    {{ Intl.NumberFormat('en-us', { style: 'decimal' }).format(tokensToPurchase - (price.availableAmount ?? 0)) }}
                    tokens more to activate the bonus
                </p>

                <p v-else class="text-sm mt-1 text-primary-500">
                    You will receive
                    {{
                        Intl.NumberFormat('en-us', { style: 'decimal' }).format(
                            Math.min(
                                price.availableAmount * (icoInfo.data.bonusPercentage / 100 / 100),
                                icoInfo.data.bonusReserve / icoInfo.data.icoDecimals
                            ),
                        )
                    }}
                    bonus tokens
                </p>
            </div>
            <div v-else>
                <p v-if="!purchaseAmount || purchaseAmount < tokensToPurchase" class="text-sm mt-2 text-primary-500">
                    You need
                    {{ Intl.NumberFormat('en-us', { style: 'decimal' }).format(tokensToPurchase - (purchaseAmount ?? 0)) }}
                    tokens more to activate the bonus.
                </p>
                
                <p v-else class="text-sm mt-1 text-primary-500">
                    You will receive
                    {{
                        Intl.NumberFormat('en-us', { style: 'decimal' }).format(
                            Math.min(
                                purchaseAmount * (icoInfo.data.bonusPercentage / 100 / 100),
                                icoInfo.data.bonusReserve / icoInfo.data.icoDecimals
                            )
                        )
                    }}
                    bonus tokens!
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
