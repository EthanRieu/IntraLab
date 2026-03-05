<template>
    <div class="h-screen w-full pt-[80px] flex flex-col bg-custom-gradient text-white">
        <Header />
        <div class="flex flex-1 w-full border-t border-white/10 overflow-hidden relative">

            <!-- Left Sidebar (Conversations List) -->
            <div
                class="w-[350px] lg:w-[400px] flex-shrink-0 border-r border-white/10 flex flex-col bg-[#1A1A1A]/80 backdrop-blur-md relative z-20">
                <div class="p-6 md:p-8 border-b border-white/10 shrink-0">
                    <h1 class="text-3xl font-bold bg-clip-text text-white uppercase tracking-wider">Messages</h1>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <div v-if="pending" class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>

                    <div v-else-if="!sessions?.length" class="text-center text-gray-500 p-8">
                        <p>Aucune conversation</p>
                    </div>

                    <NuxtLink v-else v-for="session in sessions" :key="session.id" :to="`/Messages/${session.id}`"
                        class="flex items-center gap-4 p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer w-full relative group"
                        :class="{ 'bg-white/5': session.unreadCount > 0 }"
                        active-class="bg-white/10 border-r-2 border-primary-500">

                        <!-- Unread Dot -->
                        <div v-if="session.unreadCount > 0"
                            class="absolute left-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                        </div>

                        <div
                            class="w-12 h-12 rounded-full bg-[#f8f9fa] flex items-center justify-center font-bold text-lg shrink-0 border border-white/20">
                            <span class="bg-custom-gradient bg-clip-text text-transparent tracking-wider">
                                {{ getInitials(session.otherParticipant?.firstName + ' ' +
                                    session.otherParticipant?.lastName) }}
                            </span>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline mb-1">
                                <h3 class="font-bold truncate pr-2 text-md transition-colors"
                                    :class="session.unreadCount > 0 ? 'text-white' : 'text-gray-200'">
                                    {{ session.otherParticipant?.firstName }} {{ session.otherParticipant?.lastName }}
                                </h3>
                                <span class="text-xs shrink-0"
                                    :class="session.unreadCount > 0 ? 'text-red-400 font-bold' : 'text-gray-500'">{{
                                    formatDate(session.updatedAt) }}</span>
                            </div>
                            <p class="text-sm truncate transition-colors"
                                :class="session.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-400'">
                                <span v-if="session.lastMessage?.senderId === currentUserId"
                                    class="text-gray-500 mr-1 font-normal">Vous:</span>
                                <span>{{ session.lastMessage?.content || 'Nouvelle conversation' }}</span>
                            </p>
                        </div>
                    </NuxtLink>
                </div>
            </div>

            <!-- Right Content Area -->
            <div class="flex-1 flex flex-col relative bg-transparent">
                <NuxtPage />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

definePageMeta({
    layout: false
});

const authToken = useCookie<string>('auth_token');
const currentUserId = computed(() => {
    if (!authToken.value) return null;
    try {
        const payload = authToken.value.split('.')[1];
        if (!payload) return null;
        const decoded = JSON.parse(atob(payload));
        return decoded.userId;
    } catch (e) {
        return null;
    }
});

const headers = new Headers();
if (authToken.value) {
    headers.set('Authorization', `Bearer ${authToken.value}`);
}
const { data, pending } = await useFetch<any>('/api/chat/session', { headers });
const sessions = computed(() => data.value?.data || []);

const getInitials = (name: string) => {
    if (!name || name.trim() === 'undefined undefined' || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
}
</style>
