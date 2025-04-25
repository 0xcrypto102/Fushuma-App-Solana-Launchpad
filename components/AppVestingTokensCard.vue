<script setup lang="ts">
    import { formatMonthsPeriod, formatNumber } from '~/js/utils';
    import AppSubtitle from '~/components/AppSubtitle.vue';
    import type { IIcoInfoWithKey } from '~/types/Ico';
    import AppFeatureEnabledText from '~/components/AppFeatureEnabledText.vue';

    const { icoInfo } = defineProps<{
        icoInfo: IIcoInfoWithKey;
    }>();
</script>

<template>
    <div v-if="icoInfo.data.unlockPercentage < 10000" class="bg-white shadow-sm py-6 px-4">
        <AppSubtitle title="Vesting" class="mb-3" />

        <AppFeatureEnabledText />

        <div class="grid grid-cols-2 gap-y-5 mt-5">
            <div>
                <p class="text-sm text-black/50 dark:text-white/50">Unlocked tokens</p>
                <p class="tracking-tight mt-1 font-medium">{{ icoInfo.data.unlockPercentage / 100 }}%</p>
            </div>

            <div class="text-end">
                <p class="text-sm text-black/50 dark:text-white/50">Vesting interval</p>
                <p class="tracking-tight mt-1 font-medium">{{ formatMonthsPeriod(icoInfo.data.vestingInterval) }}</p>
            </div>

            <div>
                <p class="text-sm text-black/50 dark:text-white/50">Vesting percentage</p>
                <p class="tracking-tight mt-1 font-medium">{{ icoInfo.data.vestingPercentage / 100 }}%</p>
            </div>

            <div class="text-end">
                <p class="text-sm text-black/50 dark:text-white/50">Cliff period</p>
                <p class="tracking-tight mt-1 font-medium">{{ formatMonthsPeriod(icoInfo.data.cliffPeriod) }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
