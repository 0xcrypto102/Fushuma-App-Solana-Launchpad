<script setup lang="ts">
    import { h, resolveComponent, computed, ref, onMounted, useTemplateRef } from 'vue';
    import type { TableColumn } from '@nuxt/ui';
    import { useRouter } from 'vue-router';
    import type { IIcoInfoWithKey } from '~/types/Ico';
    import { getPaginationRowModel } from '@tanstack/vue-table';
    import { formatMonthsPeriod, formatNumber, getStatus } from '~/js/utils';
    import type { UseTableInstance } from '@tanstack/vue-table';
    import { convertTokenIfAvailable, convertTokenIfAvailableWithFormatting } from '~/js/tokens';
    const UBadge = resolveComponent('UBadge');
    const UAvatar = resolveComponent('UAvatar');

    const pagination = ref({
        pageIndex: 0,
        pageSize: 10,
    });

    const props = defineProps<{
        data: IIcoInfoWithKey[];
    }>();

    const flattenedData = computed(() => {
        if (!props.data) return [];

        return props.data.map((item) => ({
            key: item.key,
            ...item.data,
            projectName: `${item.key.substring(0, 8)}...`,
            timeRemaining: calculateTimeRemaining(item.data.endDate),
            currentPrice: item.data.startPrice,
        }));
    });

    function calculateTimeRemaining(endDate: number): string {
        if (!endDate) return 'No end date';

        const now = Date.now();
        if (now >= endDate) return 'Ended';

        const remainingMs = endDate - now;
        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}d ${hours}h ${minutes}m`;
    }

    const columns: TableColumn<any>[] = [
        {
            accessorKey: 'projectName',
            header: 'Project',
            cell: ({ row }) => {
                const name = row.getValue('projectName') as string;
                return h('div', { class: 'font-medium' }, name);
            },
        },
        {
            accessorKey: 'isClosed',
            header: 'Status',
            cell: ({ row }) => {
                const isClosed = row.getValue('isClosed');
                const now = Date.now();
                const startDate = row.getValue('startDate') as number;
                const endDate = row.getValue('endDate') as number;

                const { status, color } = getStatus(
                    isClosed,
                    row.original.amount,
                    row.original.totalSold,
                    startDate,
                    now,
                    endDate,
                );

                return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => status);
            },
        },
        {
            accessorKey: 'startDate',
            header: 'Start Date',
            cell: ({ row }) => {
                const startDate = row.getValue('startDate') as number;
                return new Date(startDate).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            },
        },
        {
            accessorKey: 'endDate',
            header: 'End Date',
            cell: ({ row }) => {
                const endDate = row.getValue('endDate') as number;
                return endDate
                    ? new Date(endDate).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                      })
                    : '∞';
            },
        },
        {
            accessorKey: 'amount',
            header: 'Tokens Sold',
            cell: ({ row }) => {
                const amount = row.getValue('amount') as number;

                const totalSold = row.original.totalSold as number;
                const percentage = (totalSold / amount) * 100;

                return h('div', { class: 'space-y-1' }, [
                    h(
                        'span',
                        { class: 'mr-1' },
                        `${formatNumber((row.original.totalSold / row.original.icoDecimals).toFixed(0))}`,
                    ),
                    h(
                        'span',
                        { class: 'mr-1' },
                        `/ ${(amount / row.original.icoDecimals).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
                    ),

                    h('div', { class: 'w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700' }, [
                        h('div', {
                            class: 'bg-primary-500 rounded-full h-2 mt-2',
                            style: `width: ${Math.min(percentage, 100)}%`,
                        }),
                    ]),
                ]);
            },
        },

        {
            accessorKey: 'icoMint',
            header: 'ICO Mint',
            cell: ({ row }) => {
                const mint = row.getValue('icoMint') as string;
                return convertTokenIfAvailableWithFormatting(mint);
            },
            enableColumnFilter: true,
            filterFn: 'includesString',
        },
        {
            accessorKey: 'costMint',
            header: 'Cost Mint',
            cell: ({ row }) => {
                const mint = row.getValue('costMint') as string;
                return convertTokenIfAvailableWithFormatting(mint);
            },
            enableColumnFilter: true,
            filterFn: 'includesString',
        },
        {
            accessorKey: 'price',
            header: 'Price Range',
            cell: ({ row }) => {
                return row.original.endPrice === 0
                    ? formatNumber(
                          row.original.startPrice / row.original.icoDecimals,
                          row.original.icoDecimals.toString().length - 1,
                      )
                    : `${formatNumber(row.original.startPrice / row.original.icoDecimals, row.original.icoDecimals.toString().length - 1)} - ${formatNumber(row.original.endPrice / row.original.icoDecimals, row.original.icoDecimals.toString().length - 1)}`;
            },
        },

        {
            accessorKey: 'unlockPercentage',
            header: 'Unlocked',
            cell: ({ row }) => {
                const unlockPercentage = row.getValue('unlockPercentage') as number;
                return `${unlockPercentage / 100}%`;
            },
        },
        {
            accessorKey: 'cliffPeriod',
            header: 'Cliff',
            cell: ({ row }) => {
                const cliffPeriod = row.getValue('cliffPeriod') as number;
                return formatMonthsPeriod(row.original.cliffPeriod);
            },
        },
        {
            accessorKey: 'vestingInterval',
            header: 'Vesting',
            cell: ({ row }) => {
                const vestingInterval = row.getValue('vestingInterval') as number;

                const vestingPercentage = row.original.vestingPercentage as number;

                return `${vestingPercentage / 100}% / ${formatMonthsPeriod(vestingInterval)}`;
            },
        },
    ];

    const router = useRouter();
    const searchQuery = ref('');
    const table = useTemplateRef('table');

    onMounted(() => {
        // Initial setup for the filter if needed
    });

    function applyGlobalFilter() {
        if (table.value) {
            table.value.tableApi?.setGlobalFilter(searchQuery.value);
        }
    }

    function navigateToDetail(row: { original: any }) {
        router.push(`/${row.original.key}`);
    }

    // Global filter function that searches across project name and ICO mint
    function globalFilterFn(row: any, columnId: string, filterValue: string) {
        if (!filterValue) return true;

        const searchTerm = filterValue.toLowerCase();
        const projectName = row.getValue('projectName')?.toLowerCase() || '';
        const icoMint = row.getValue('icoMint')?.toLowerCase() || '';

        return projectName.includes(searchTerm) || icoMint.includes(searchTerm);
    }
</script>

<template>
    <div class="flex-1 divide-y divide-(--ui-border-accented) w-full">
        <div class="flex items-center gap-2 py-3.5 overflow-x-auto">
            <UInput
                v-model="searchQuery"
                class="w-full min-w-[12ch]"
                placeholder="Search by project name or ICO mint..."
                @update:model-value="applyGlobalFilter"
            />
        </div>

        <UTable
            v-model:pagination="pagination"
            :pagination-options="{
                getPaginationRowModel: getPaginationRowModel(),
            }"
            ref="table"
            :data="flattenedData"
            :columns="columns"
            :global-filter-fn="globalFilterFn"
            sticky
            class="w-full"
            @select="navigateToDetail"
        >
            <template #expanded="{ row }">
                <pre>{{ row.original }}</pre>
            </template>
        </UTable>
        <div class="flex justify-between items-center">
            <div class="px-4 py-3.5 text-sm border-none text-(--ui-text-muted)">
                Total {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s).
            </div>

            <div class="flex justify-center border-none">
                <UPagination
                    class="!border-none"
                    :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                    :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                    :total="table?.tableApi?.getFilteredRowModel().rows.length"
                    @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
    :deep(tbody tr) {
        cursor: pointer;
        transition: background-color 0.2s;
    }

    :deep(tbody tr:hover) {
        background-color: rgba(0, 0, 0, 0.05);
    }

    :deep(.dark tbody tr:hover) {
        background-color: rgba(255, 255, 255, 0.05);
    }
</style>
