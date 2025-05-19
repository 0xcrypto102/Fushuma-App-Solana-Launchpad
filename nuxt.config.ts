import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineNuxtConfig({
    modules: ['@nuxt/ui', '@pinia/nuxt'],
    css: ['~/assets/css/main.css'],
    ssr: false,
    devtools: { enabled: true },

    app: {
        head: {
            title: 'Fushuma Solana Launchpad',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                {
                    name: 'description',
                    content: 'Fushuma Solana Launchpad - A platform for launching ICOs on Solana blockchain',
                },
                { name: 'theme-color', content: '#ffffff' },
                { property: 'og:title', content: 'Fushuma Solana Launchpad' },
                { property: 'og:description', content: 'Launch your ICO on Solana blockchain with Fushuma Launchpad' },
                { property: 'og:type', content: 'website' },
                { property: 'og:site_name', content: 'Fushuma Launchpad' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: 'Fushuma Solana Launchpad' },
                { name: 'twitter:description', content: 'Launch your ICO on Solana blockchain with Fushuma Launchpad' },
            ],
            link: [
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                { rel: 'stylesheet', href: 'https://use.typekit.net/ygo0fdl.css' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Expletus+Sans:wght@700&display=swap'
                },
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            ],
        },
    },

    vite: {
        plugins: [tailwindcss(), nodePolyfills({ include: ['stream'], globals: { process: true, Buffer: true } })],
        // Handle React dependency issues
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis',
                }
            },
            include: ['@solana/web3.js'],
            exclude: ['react-dom'],
        },
        build: {
            commonjsOptions: {
                transformMixedEsModules: true,
            },
        },
    },

    colorMode: {
        preference: 'light',
        fallback: 'light',
        classSuffix: '',
    },

    compatibilityDate: '2025-03-25',
});
