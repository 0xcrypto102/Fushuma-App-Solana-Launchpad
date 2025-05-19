<script setup lang="ts">
    import { h, resolveComponent } from 'vue';
    import type { TableColumn } from '@nuxt/ui';
    import type { IIcoInfo, IUserPurchaseWithKey } from '~/types/Ico';

    export interface IClaimContext {
        userPurchaseKey: string;
        button: {
            loading: boolean;
        };
    }

    const { userPurchases, userPurchasesFetched, ico } = defineProps<{
        ico: IIcoInfo | null;
        userPurchasesFetched: boolean;
        userPurchases: IUserPurchaseWithKey[] | null;
    }>();

    watch(
        () => userPurchases,
        () => {
            initButtons();
        },
    );

    onMounted(() => {
        initButtons();
    });

    const initButtons = () => {
        if (userPurchases) {
            userPurchases.forEach((up) => {
                buttons[up.key] = {
                    loading: false,
                };
            });
        }
    };

    const emits = defineEmits<{
        (event: 'claim', context: IClaimContext): void;
    }>();

    const buttons = reactive({});
    const UButton = resolveComponent('UButton');

    const isCliffActive = (buyDate: string) => {
        return new Date(buyDate + (ico?.cliffPeriod ?? 0) * 1000).getTime() > Date.now();
    };

    const evmFlag = computed(() => {
        if(useRoute().params.id.includes["evm"]) {
            return true;
        } 
        return false;
    })

    const columns: TableColumn<IUserPurchaseWithKey>[] = [
        {
            accessorKey: 'data.buyDate',
            header: 'Buy Date',
            cell: ({ row }) => {
                return new Date(evmFlag? row.original.buyDate : row.original.data.buyDate).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
        },
        {
            accessorKey: 'data.buyAmount',
            header: 'Buy Amount',
            cell: ({ row }) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                }).format(evmFlag? row.original.buyAmount / (ico?.icoDecimals ?? 1) : row.original.data.buyAmount / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'data.lockedAmount',
            header: 'Locked Amount',
            cell: ({ row }) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                }).format(evmFlag? row.original.lockedAmount  / (ico?.icoDecimals ?? 1) : row.original.data.lockedAmount / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'data.totalClaimed',
            header: 'Total Claimed',
            cell: ({ row }) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                }).format(evmFlag? row.original.totalClaimed / (ico?.icoDecimals ?? 1) : row.original.data.totalClaimed / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'key',
            header: 'Claim Action',
            cell: ({ row }) => {
                return h(UButton, {
                    label: isCliffActive(evmFlag? row.original.buyDate : row.original.data.buyDate) ? 'Cliff active' : 'Claim',
                    color: 'primary',
                    class: 'dark:text-white',
                    disabled:
                        isCliffActive(evmFlag? row.original.buyDate : row.original.data.buyDate) ||
                        (evmFlag? row.original.totalClaimed : row.original.data.totalClaimed) >=  (evmFlag? row.original.lockedAmount : row.original.data.lockedAmount),
                    loading: buttons[row.original.key].loading,
                    onClick: () => {
                        // emits('claim', {
                        //     userPurchaseKey: row.original.key,
                        //     button: buttons[row.original.key as any],
                        // });
                    },
                });
            },
        },
    ];
</script>

<template>
    <div class="flex-1 divide-y divide-(--ui-border-accented) w-full">
        <UTable
            :loading="!userPurchasesFetched"
            ref="table"
            :data="userPurchases ?? []"
            :columns="columns"
            sticky
            class="h-96"
        >
            <template #expanded="{ row }">
                <pre>{{ row.original }}</pre>
            </template>
        </UTable>
    </div>
</template>
