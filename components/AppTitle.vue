<script setup lang="ts">
    const { title } = defineProps<{
        title: string;
    }>();
</script>

<template>
    <h1 class="font-semibold expletus text-3xl tracking-tight">{{ title }}</h1>
</template>

<style scoped></style>
