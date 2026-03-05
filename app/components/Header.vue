<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';

const { isAuthenticated, user, logout, token } = useAuth();
const isDropdownOpen = ref(false);
const avatarUrl = ref<string | null>(null);

const getInitials = () => {
    if (!user.value || !user.value.firstName || !user.value.lastName) return 'U';
    return `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase();
};

const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        isDropdownOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeDropdown);
    const stored = localStorage.getItem('user_avatar_url');
    if (stored) avatarUrl.value = stored;
});

// Fetch chat sessions to check for unread messages
const { data: chatData } = useFetch<any>('/api/chat/session', {
    headers: computed(() => (token.value ? { Authorization: `Bearer ${token.value}` } : {}) as HeadersInit),
    server: false, // Client side only to avoid SSR hydration issues with auth
    immediate: true,
    watch: [isAuthenticated] // Re-fetch if auth state changes
});

const hasUnreadMessages = computed(() => {
    const res = chatData.value as any;
    if (!res || !res.data) return false;
    return res.data.some((session: any) => session.unreadCount > 0);
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
});
</script>

<template>
    <header
        class="fixed top-0 left-0 right-0 z-50 w-full bg-[#1A1A1A]/80 backdrop-blur-md border-b border-white/10 h-[80px] flex items-center justify-between px-6 md:px-12">
        <!-- Logo (Left) -->
        <div class="flex-1">
            <NuxtLink to="/" class="text-2xl font-bold font-mono tracking-wide text-white">IntraLab</NuxtLink>
        </div>

        <!-- Navigation (Center) -->
        <nav
            class="hidden md:flex gap-8 items-center justify-center font-sans text-sm font-medium text-gray-400 flex-1">
            <NuxtLink to="/" exact-active-class="text-white font-bold underline underline-offset-8 decoration-2"
                class="hover:text-white transition-colors">Accueil</NuxtLink>
            <NuxtLink to="/Blog/blog" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                class="hover:text-white transition-colors">Blog</NuxtLink>
            <NuxtLink to="/Loans" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                class="hover:text-white transition-colors">Emprunts</NuxtLink>
            <NuxtLink to="/MarketPlace" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                class="hover:text-white transition-colors">Marketplace</NuxtLink>
        </nav>

        <!-- CTA / Auth Button (Right) -->
        <div class="flex-1 flex justify-end items-center gap-4">
            <NuxtLink v-if="!isAuthenticated" to="/Auth/signIn"
                class="px-6 py-2 bg-white text-black font-extrabold rounded-full hover:bg-gray-200 transition-colors text-sm tracking-wide">
                Se connecter
            </NuxtLink>

            <template v-else>
                <!-- Messages Button -->
                <NuxtLink to="/Messages" class="p-2 text-gray-400 hover:text-white transition-colors relative"
                    title="Messagerie">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <!-- Unread Badge -->
                    <span v-if="hasUnreadMessages" class="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span
                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-[#1A1A1A]"></span>
                    </span>
                </NuxtLink>

                <!-- Avatar Dropdown -->
                <div class="relative ml-2" ref="dropdownRef">
                    <!-- Avatar Button -->
                    <button @click="toggleDropdown"
                        class="h-10 w-10 rounded-full bg-[#f8f9fa] flex items-center justify-center font-bold shadow-md hover:scale-105 transition-all focus:outline-none select-none border border-white/20 overflow-hidden">
                        <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar"
                            class="w-full h-full object-cover hover:opacity-90" />
                        <span v-else class="bg-custom-gradient bg-clip-text text-transparent text-lg tracking-wider">
                            {{ getInitials() }}
                        </span>
                    </button>

                    <!-- Dropdown Menu -->
                    <transition name="dropdown">
                        <div v-if="isDropdownOpen"
                            class="absolute right-0 mt-3 w-48 rounded-2xl bg-[#1A1A1A] border border-white/10 shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl origin-top-right">

                            <NuxtLink to="/Dashboard" @click="isDropdownOpen = false"
                                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profil
                            </NuxtLink>

                            <NuxtLink to="#" @click.prevent="isDropdownOpen = false"
                                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </NuxtLink>

                            <div class="h-px bg-white/10 my-1 mx-2"></div>

                            <button @click="logout"
                                class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                LogOut
                            </button>
                        </div>
                    </transition>
                </div>
            </template>
        </div>
    </header>
</template>

<style scoped>
/* Animated Dropdown Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
}

.dropdown-enter-to,
.dropdown-leave-from {
    opacity: 1;
    transform: scale(1) translateY(0);
}
</style>
