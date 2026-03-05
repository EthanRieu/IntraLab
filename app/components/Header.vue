<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useChat } from '~/composables/useChat';

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

// Fetch initial chat sessions to check for unread messages
const { data: chatData } = useFetch<any>('/api/chat/session', {
    headers: computed(() => (token.value ? { Authorization: `Bearer ${token.value}` } : {}) as HeadersInit),
    server: false,
    immediate: true,
    watch: [isAuthenticated]
});

const hasUnreadMessages = ref(false);

watch(chatData, (data) => {
    const res = data as any;
    if (!res || !res.data) return;
    hasUnreadMessages.value = res.data.some((session: any) => session.unreadCount > 0);
}, { immediate: true });

// Notifications
const isNotifOpen = ref(false);
const notifRef = ref<HTMLElement | null>(null);

const { data: notifData, refresh: refreshNotifs } = useFetch<any>('/api/notifications', {
    query: { limit: 8 },
    headers: computed(() => (token.value ? { Authorization: `Bearer ${token.value}` } : {}) as HeadersInit),
    server: false,
    immediate: true,
    watch: [isAuthenticated]
});

const unreadCount = ref(0);
const notifications = ref<any[]>([]);

watch(notifData, (data) => {
    unreadCount.value = data?.data?.stats?.unreadCount ?? 0;
    notifications.value = data?.data?.notifications ?? [];
}, { immediate: true });

const toggleNotif = async () => {
    isNotifOpen.value = !isNotifOpen.value;
    if (isNotifOpen.value && unreadCount.value > 0) {
        await $fetch('/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
        });
        await refreshNotifs();
    }
};

const closeNotif = (e: MouseEvent) => {
    if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
        isNotifOpen.value = false;
    }
};

const notifIcon = (type: string) => {
    if (type === 'loan_request') return '📦';
    if (type === 'article_pending') return '📝';
    return '🔔';
};

const formatNotifDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString('fr-FR');
};

// Real-time WebSocket
const { connect, on } = useChat();
let unsubscribers: (() => void)[] = [];

onMounted(() => {
    document.addEventListener('click', closeDropdown);
    document.addEventListener('click', closeNotif);
    const stored = localStorage.getItem('user_avatar_url');
    if (stored) avatarUrl.value = stored;

    if (token.value) {
        connect(token.value);

        // Listen for unread message badge (sent by server to non-room recipients)
        unsubscribers.push(on('unread_message', () => {
            hasUnreadMessages.value = true;
        }));

        // Listen for real-time notifications
        unsubscribers.push(on('new_notification', (data: any) => {
            const notif = data.notification;
            if (!notif) return;
            notifications.value = [notif, ...notifications.value].slice(0, 8);
            unreadCount.value += 1;
        }));
    }
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
    document.removeEventListener('click', closeNotif);
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
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
                    title="Messagerie" @click="hasUnreadMessages = false">
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

                <!-- Notification Bell -->
                <div class="relative" ref="notifRef">
                    <button @click.stop="toggleNotif"
                        class="p-2 text-gray-400 hover:text-white transition-colors relative">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span v-if="unreadCount > 0"
                            class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-[#1A1A1A]">
                            {{ unreadCount > 9 ? '9+' : unreadCount }}
                        </span>
                    </button>

                    <!-- Notifications Dropdown -->
                    <transition name="dropdown">
                        <div v-if="isNotifOpen"
                            class="absolute right-0 mt-3 w-80 rounded-2xl bg-[#1A1A1A] border border-white/10 shadow-2xl z-50 overflow-hidden">
                            <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <span class="text-sm font-bold text-white">Notifications</span>
                                <span v-if="unreadCount === 0" class="text-xs text-gray-500">Tout lu</span>
                            </div>
                            <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-gray-500 text-sm">
                                Aucune notification
                            </div>
                            <div v-else class="max-h-[360px] overflow-y-auto">
                                <div v-for="notif in notifications" :key="notif.id"
                                    class="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start"
                                    :class="!notif.read ? 'bg-white/[0.03]' : ''">
                                    <span class="text-lg shrink-0 mt-0.5">{{ notifIcon(notif.type) }}</span>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-semibold text-white leading-tight">{{ notif.title }}</p>
                                        <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                                        <p class="text-[11px] text-gray-600 mt-1">{{ formatNotifDate(notif.createdAt) }}</p>
                                    </div>
                                    <span v-if="!notif.read" class="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-2"></span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

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
