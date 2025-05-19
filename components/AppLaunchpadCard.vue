<script setup lang="ts">
    import launchpads from '@/assets/launchpads.json';
    import type { IIcoInfoWithKey } from '@/types/Ico';
    import { ref, computed, onMounted, onUnmounted } from 'vue';
    import { useRouter } from 'vue-router';
    import { formatMonthsPeriod, formatNumber, getStatus } from '~/js/utils';
    import { convertTokenIfAvailableWithFormatting } from '~/js/tokens';

    const props = defineProps<{
        data: IIcoInfoWithKey;
        launchpad: any;
    }>();

    const currentTime = ref(Date.now());
    let timerInterval: number | null = null;
    let evmFlag = ref<boolean | null>(null);

    const router = useRouter();

    const combinedData = ref<IIcoInfoWithKey & { launchpad: any }>({
        key: props.data.key,
        data: {
            ...props.data.data,
        },
        launchpad: props.launchpad,
    });

    onMounted(() => {
        const l = launchpads.find((p) => p.key === props.data.key);
        if (l) {
            combinedData.value.launchpad = l;
        }

        startTimer();
    });

    onUnmounted(() => {
        stopTimer();
    });

    onMounted(async () => {
        if (props.data.key.slice(0,2) == "0x") {
            evmFlag.value = true; 
        } else {
            evmFlag.value = false; 
        }
    });

    function startTimer() {
        timerInterval = window.setInterval(() => {
            currentTime.value = Date.now();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    const timeRemaining = computed(() => {
        const endDate = props.data.data.endDate;

        if (!endDate) return 'No end date';

        const now = currentTime.value;
        if (now >= endDate) return 'Ended';

        const remainingMs = endDate - now;
        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });

    const projectName = computed(() => {
        return props.data.key.substring(0, 8) + '...';
    });

    const status = computed(() => {
        const endDateString = props.data.data.endDate ? String(props.data.data.endDate) : '';

        const { status, color } = getStatus(
            Number(props.data.data.isClosed),
            Number(props.data.data.amount),
            Number(props.data.data.totalSold),
            String(props.data.data.startDate),
            String(currentTime.value),
            endDateString,
        );
        return { status, color };
    });

    const formattedStartDate = computed(() => {
        return new Date(Number(props.data.data.startDate)).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    });

    const formattedEndDate = computed(() => {
        return props.data.data.endDate
            ? new Date(Number(props.data.data.endDate)).toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '∞';
    });

    const progressPercentage = computed(() => {
        const totalSold = Number(props.data.data.totalSold);
        const amount = Number(props.data.data.amount);
        return (totalSold / amount) * 100;
    });

    const priceRange = computed(() => {
        const startPrice = Number(props.data.data.startPrice);
        const endPrice = Number(props.data.data.endPrice);
        const icoDecimals = Number(props.data.data.icoDecimals);
        const decimalPlaces = icoDecimals.toString().length - 1;

        return endPrice === 0
            ? formatNumber(startPrice / icoDecimals, decimalPlaces)
            : `${formatNumber(startPrice / icoDecimals, decimalPlaces)} - ${formatNumber(endPrice / icoDecimals, decimalPlaces)}`;
    });

    function navigateToDetail() {
        if (props.data.key.slice(0,2) == "0x") {
            router.push(`/evm/${props.data.key}-${props.data.data.seed}`);
        } else {
            router.push(`/${props.data.key}`);
        }
    }
</script>

<template>
    <div
        class="card bg-white dark:bg-gray-800 shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateToDetail"
    >
        <div class="p-5">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                    <div v-if="combinedData.launchpad?.projectLogo" class="mr-3">
                        <img
                            :src="combinedData.launchpad.projectLogo"
                            alt="Project Logo"
                            class="w-8 h-8 rounded-full object-contain"
                        />
                    </div>
                    <div class="font-bold text-lg expletus">{{ combinedData.launchpad?.name || projectName }}</div>
                </div>
                <UBadge
                    class="capitalize"
                    variant="subtle"
                    :color="
                        status.color as 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
                    "
                    >{{ status.status }} on {{!evmFlag ? "Solana" : "Fushuma"}}</UBadge
                >
            </div>

            <div class="flex gap-3 mb-4 h-[28px]">
                <a
                    v-if="combinedData.launchpad?.links?.web"
                    :href="combinedData.launchpad.links.web.url"
                    target="_blank"
                    class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                    @click.stop
                >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                </a>
                <a
                    v-if="combinedData.launchpad?.links?.x"
                    :href="combinedData.launchpad.links.x.url"
                    target="_blank"
                    class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                    @click.stop
                >
                    <UIcon name="simple-icons:x" class="w-4 h-4" />
                </a>
                <a
                    v-if="combinedData.launchpad?.links?.telegram"
                    :href="combinedData.launchpad.links.telegram.url"
                    target="_blank"
                    class="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                    @click.stop
                >
                    <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
                </a>
            </div>

            <div class="pb-4">
                <div class="text-sm text-gray-500 dark:text-gray-400">Price Range</div>
                <div class="font-medium">{{ priceRange }}</div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">ICO Token</div>
                    <div class="font-medium">{{ convertTokenIfAvailableWithFormatting(props.data.data.icoMint) }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Payment token</div>
                    <div class="font-medium">{{ convertTokenIfAvailableWithFormatting(props.data.data.costMint) }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Time Remaining</div>
                    <div class="font-medium">{{ timeRemaining }}</div>
                </div>
            </div>

            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ formatNumber(Number(props.data.data.totalSold) / Number(props.data.data.icoDecimals), 0) }}
                        / {{ formatNumber(Number(props.data.data.amount) / Number(props.data.data.icoDecimals), 0) }}
                    </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                        class="bg-primary-500 rounded-full h-2"
                        :style="`width: ${Math.min(progressPercentage, 100)}%`"
                    ></div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Unlocked</div>
                    <div class="font-medium">{{ Number(props.data.data.unlockPercentage) / 100 }}%</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Cliff</div>
                    <div class="font-medium">{{ formatMonthsPeriod(Number(props.data.data.cliffPeriod)) }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Vesting</div>
                    <div class="font-medium">
                        {{ Number(props.data.data.vestingPercentage) / 100 }}% /
                        {{ formatMonthsPeriod(Number(props.data.data.vestingInterval)) }}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Started the</div>
                    <div class="font-medium">{{ formattedStartDate }}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Ends the</div>
                    <div class="font-medium">{{ formattedEndDate }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .card {
        transition: all 0.3s ease;
    }
    .card:hover {
        transform: translateY(-2px);
    }
</style>
