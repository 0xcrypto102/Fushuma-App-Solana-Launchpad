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

    const buttons = reactive<Record<string, { loading: boolean }>>({});

    const UButton = resolveComponent('UButton');

    const isCliffActive = (buyDate: string) => {
        if (!ico || !ico.cliffPeriod) {
            return false;
        }
        if (!buyDate) {
            return false;
        }
        if (isNaN(new Date(buyDate).getTime())) {
            return false;
        }

        return new Date(buyDate + (ico?.cliffPeriod ?? 0) * 1000).getTime() > Date.now();
    };

    const columns: TableColumn<IUserPurchaseWithKey>[] = [
        {
            accessorKey: 'data.buyDate',
            header: 'Buy Date',
            cell: ({ row }) => {
                return new Date(row.original.data.buyDate).toLocaleString('en-US', {
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
                }).format(row.original.data.buyAmount / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'data.lockedAmount',
            header: 'Locked Amount',
            cell: ({ row }) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                }).format(row.original.data.lockedAmount / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'data.totalClaimed',
            header: 'Total Claimed',
            cell: ({ row }) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                }).format(row.original.data.totalClaimed / (ico?.icoDecimals ?? 1));
            },
        },
        {
            accessorKey: 'key',
            header: 'Claim Action',
            cell: ({ row }) => {
                return h(UButton, {
                    label: isCliffActive(row.original.data.buyDate.toString()) ? 'Cliff active' : 'Claim',
                    color: 'primary',
                    class: 'dark:text-white',
                    disabled:
                        isCliffActive(row.original.data.buyDate.toString()) ||
                        row.original.data.totalClaimed >=  row.original.data.lockedAmount,
                    loading: buttons[row.original.key].loading,
                    onClick: () => {
                        emits('claim', {
                            userPurchaseKey: row.original.key,
                            button: buttons[row.original.key as any],
                        });
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
