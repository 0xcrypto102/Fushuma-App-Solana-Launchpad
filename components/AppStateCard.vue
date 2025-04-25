<template>
    <div class="flex space-x-2 items-start w-1/2 mx-auto justify-center md:items-center py-2 border-b border-gray-200">
        <div v-if="loading" class="flex items-center space-x-3">
            <AppSpinner :size="2" />
            <span>Loading account</span>
        </div>
        <h3 :class="error ? 'text-red-500' : 'text-gray-400'" class="text-sm"><slot></slot></h3>
    </div>
</template>

<script setup lang="ts">
    withDefaults(
        defineProps<{
            loading?: boolean;
            error?: boolean;
        }>(),
        { loading: false, error: false },
    );
</script>
