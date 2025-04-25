<script setup lang="ts">
    withDefaults(
        defineProps<{
            size: number;
        }>(),
        {
            size: 4,
        },
    );
</script>

<template>
    <svg
        id="loading-spinner"
        xmlns="http://www.w3.org/2000/svg"
        :width="size * 10"
        :height="size * 10"
        viewBox="0 0 48 48"
    >
        <g fill="none">
            <path
                id="track"
                fill="#c94338"
                d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0 C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44 C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4 C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z"
            />
            <path
                id="section"
                fill="white"
                d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z"
            />
        </g>
    </svg>
</template>

<style scoped>
    #loading-spinner {
        border-radius: 50%;
        animation: loading-spinner 1s linear infinite;
    }

    @keyframes loading-spinner {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
