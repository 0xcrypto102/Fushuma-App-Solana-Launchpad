<script setup lang="ts">
    import AppSubtitle from '~/components/AppSubtitle.vue';
    import type { IIcoInfoWithKey } from '~/types/Ico';
    import { formatDate, formatNumber, IcoStatus } from '~/js/utils';
    import { DataWrapper } from '~/types/DataWrapper';

    const { icoInfo, status, currentPrice } = defineProps<{
        icoInfo: IIcoInfoWithKey;
        status: IcoStatus;
        currentPrice: DataWrapper<number>;
    }>();

    const soldTokensPercentage = computed(() => {
        return (icoInfo.data.totalSold / icoInfo.data.amount) * 100;
    });
</script>

<template>
    <div class="bg-white shadow-sm py-6 px-4">
        <AppSubtitle title="Sale progress" class="mb-3.5" />

        <div class="flex items-center space-x-2">
            <p class="text-sm text-primary-500 font-semibold tracking-tight">
                {{ formatNumber(soldTokensPercentage) }}%
            </p>
            <UProgress v-model="soldTokensPercentage" />
        </div>

        <div class="grid grid-cols-2 gap-y-5 tracking-tight mt-5">
            <div>
                <p class="text-sm text-black/50 dark:text-white/50">Current price per token</p>

                <p v-if="status !== IcoStatus.Live && status !== IcoStatus.Upcoming">-</p>
                <AppSpinner v-else-if="!currentPrice.fetched" class="mt-1.5" :size="2" />
                <Icon
                    v-else-if="currentPrice.error || currentPrice.data === null"
                    name="lucide:octagon-x"
                    class="text-white text-xl w-4 h-4"
                />
                <p v-else class="tracking-tight mt-1 font-medium">
                    {{ formatNumber(currentPrice.data, icoInfo.data.icoDecimals.toString().length - 1) }}
                </p>
            </div>

            <div class="text-end">
                <p class="text-sm text-black/50 dark:text-white/50">Total tokens</p>
                <p class="tracking-tight mt-1 font-medium">
                    {{
                        Intl.NumberFormat('en-us', { style: 'decimal' }).format(
                            icoInfo.data.amount / icoInfo.data.icoDecimals,
                        )
                    }}
                    tokens
                </p>
            </div>

            <div>
                <p class="text-sm text-black/50 dark:text-white/50">Total sold</p>

                <p class="tracking-tight mt-1 font-medium">
                    {{
                        Intl.NumberFormat('en-us', { style: 'decimal' }).format(
                            icoInfo.data.totalSold / icoInfo.data.icoDecimals,
                        )
                    }}
                    tokens
                </p>
            </div>

            <div class="text-end">
                <p class="text-sm text-black/50 dark:text-white/50">Total received</p>

                <p class="tracking-tight mt-1 font-medium">
                    {{
                        Intl.NumberFormat('en-us', { style: 'decimal' }).format(
                            icoInfo.data.totalSold / icoInfo.data.icoDecimals,
                        )
                    }}
                    tokens
                </p>
            </div>

            <div>
                <p class="text-sm text-black/50 dark:text-white/50">Start date</p>
                <p class="tracking-tight mt-1 font-medium">{{ formatDate(icoInfo.data.startDate) }}</p>
            </div>

            <div class="text-end">
                <p class="text-sm text-black/50 dark:text-white/50">End date</p>
                <p class="tracking-tight mt-1 font-medium">
                    {{ icoInfo.data.endDate === 0 ? '∞' : formatDate(icoInfo.data.endDate) }}
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
