<script setup lang="ts">
import GlassSurface from '~/components/ui/GlassSurface.vue';
import { useAuth } from '~/composables/useAuth';

const { isAuthenticated, logout } = useAuth();
</script>

<template>
    <div class="fixed top-8 left-0 right-0 z-50 flex justify-center px-4 w-full">
        <GlassSurface
            class="rounded-full px-8 py-3 flex items-center justify-between gap-12 max-w-5xl w-full md:w-auto relative"
            :border-radius="50" width="auto" height="auto" :blur="20" :border-width="0.1" :opacity="0.1">
            <!-- Logo -->
            <NuxtLink to="/" class="text-xl font-bold font-mono tracking-wide text-white">IntraLab</NuxtLink>

            <!-- Navigation -->
            <nav class="hidden md:flex gap-8 items-center font-sans text-sm font-medium text-gray-400">
                <NuxtLink to="/" exact-active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">
                    Accueil</NuxtLink>
                <NuxtLink to="/Blog/blog" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">Blog</NuxtLink>
                <NuxtLink to="/Loans" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">
                    Emprunts</NuxtLink>
                <NuxtLink to="/MarketPlace"
                    active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">Marketplace</NuxtLink>
            </nav>

            <!-- CTA / Auth Button -->
            <NuxtLink v-if="!isAuthenticated" to="/Auth/signIn"
                class="px-6 py-2 bg-white text-black font-extrabold rounded-full hover:bg-gray-200 transition-colors text-sm tracking-wide">
                Se connecter
            </NuxtLink>

            <div v-else class="flex flex-row gap-3 items-center">
                <NuxtLink to="/Dashboard"
                    class="px-5 py-2 bg-white/10 border border-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all text-sm tracking-wide">
                    Dashboard
                </NuxtLink>
                <!-- Simple logout button icon -->
                <button @click="logout" class="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Se déconnecter">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </GlassSurface>
    </div>
</template>

<style scoped>
/* Optional: smoother active link transition if needed */
</style>
