<template>
    <!-- Mobile in conv: h-dvh (keyboard-aware, no app header offset) -->
    <!-- Mobile no conv / desktop: standard layout with app header -->
    <div :class="[
        'w-full flex flex-col bg-custom-gradient text-white',
        hasActiveConv ? 'h-dvh md:h-screen md:pt-[80px]' : 'h-screen pt-[80px]'
    ]">
        <!-- App Header: hidden on mobile when inside a conversation to save space -->
        <div :class="hasActiveConv ? 'hidden md:block' : ''">
            <Header />
        </div>

        <div :class="[
            'flex flex-1 w-full overflow-hidden relative',
            hasActiveConv ? 'md:border-t md:border-white/10' : 'border-t border-white/10'
        ]">

            <!-- Left Sidebar (Conversations List) -->
            <!-- Mobile: full width when no conv selected, hidden when conv is open -->
            <!-- Desktop: fixed sidebar width, always visible -->
            <div :class="[
                'flex-shrink-0 border-r border-white/10 flex-col bg-[#1A1A1A]/80 backdrop-blur-md relative z-20',
                'md:flex md:w-[350px] lg:w-[400px]',
                hasActiveConv ? 'hidden' : 'flex w-full'
            ]">
                <div class="p-6 md:p-8 border-b border-white/10 shrink-0 flex items-center justify-between">
                    <h1 class="text-3xl font-bold bg-clip-text text-white uppercase tracking-wider">Messages</h1>
                    <button @click="openNewMessage"
                        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/50 transition-all duration-200 text-gray-400 hover:text-white"
                        title="Nouveau message">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
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
                            class="w-12 h-12 rounded-full bg-[#f8f9fa] flex items-center justify-center font-bold text-lg shrink-0 border border-white/20 overflow-hidden">
                            <img v-if="session.otherParticipant?.avatar"
                                :src="session.otherParticipant.avatar"
                                :alt="session.otherParticipant.firstName"
                                class="w-full h-full object-cover" />
                            <span v-else class="bg-custom-gradient bg-clip-text text-transparent tracking-wider">
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
            <!-- Mobile: shown only when a conv is selected -->
            <div :class="[
                'flex-1 flex-col relative bg-transparent',
                hasActiveConv ? 'flex' : 'hidden md:flex'
            ]">
                <NuxtPage />
            </div>
        </div>
    </div>

    <!-- New Message Modal -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showNewMessage"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                @click.self="closeNewMessage">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

                <div class="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                        <h2 class="text-lg font-bold text-white">Nouveau message</h2>
                        <button @click="closeNewMessage"
                            class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Search + Filter -->
                    <div class="p-4 border-b border-white/10 shrink-0 flex gap-2">
                        <div class="relative flex-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/60 transition-colors"
                            />
                        </div>
                        <button @click="showFilters = !showFilters"
                            :class="[
                                'shrink-0 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                                (activeClass || activeSpec) || showFilters
                                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            ]">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .707 1.707L13 13.414V19a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 7 17v-3.586L3.293 5.707A1 1 0 0 1 3 4z" />
                            </svg>
                        </button>
                    </div>

                    <!-- Filters Panel -->
                    <Transition name="slide">
                        <div v-if="showFilters" class="px-4 pt-3 pb-0 border-b border-white/10 shrink-0 space-y-3">
                            <div v-if="loadingFilters" class="flex justify-center py-3">
                                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                            <template v-else>
                                <!-- Classes -->
                                <div v-if="filterClasses.length">
                                    <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Classe</p>
                                    <div class="flex flex-wrap gap-1.5 pb-3">
                                        <button v-for="c in filterClasses" :key="c.slug"
                                            @click="activeClass = activeClass === c.slug ? '' : c.slug"
                                            :class="[
                                                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                                                activeClass === c.slug
                                                    ? 'bg-primary-500/30 border-primary-500/60 text-primary-300'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                            ]">
                                            {{ c.name }}
                                        </button>
                                    </div>
                                </div>
                                <!-- Specs -->
                                <div v-if="filterSpecs.length">
                                    <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Spécialisation</p>
                                    <div class="flex flex-wrap gap-1.5 pb-3">
                                        <button v-for="s in filterSpecs" :key="s.slug"
                                            @click="activeSpec = activeSpec === s.slug ? '' : s.slug"
                                            :class="[
                                                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                                                activeSpec === s.slug
                                                    ? 'bg-primary-500/30 border-primary-500/60 text-primary-300'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                            ]">
                                            {{ s.name }}
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </Transition>

                    <!-- Users List -->
                    <div class="flex-1 overflow-y-auto custom-scrollbar">
                        <div v-if="searchLoading" class="flex justify-center py-8">
                            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                        <div v-else-if="!searchResults.length" class="text-center text-gray-500 py-8 text-sm">
                            Aucun utilisateur trouvé
                        </div>
                        <button v-else v-for="user in searchResults" :key="user.id"
                            @click="startConversation(user.id)"
                            :disabled="startingChat"
                            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left disabled:opacity-50">
                            <div class="w-10 h-10 rounded-full shrink-0 border border-white/20 overflow-hidden bg-[#f8f9fa] flex items-center justify-center font-bold">
                                <img v-if="user.avatar" :src="user.avatar" :alt="user.firstName" class="w-full h-full object-cover" />
                                <span v-else class="bg-custom-gradient bg-clip-text text-transparent text-sm tracking-wider">
                                    {{ getInitials(user.firstName + ' ' + user.lastName) }}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-white truncate">{{ user.firstName }} {{ user.lastName }}</p>
                                <p class="text-xs text-gray-500 truncate">
                                    <template v-if="user.class">
                                        <span>{{ user.class.name }}</span>
                                        <span v-if="user.specialization"> · {{ user.specialization.name }}</span>
                                    </template>
                                    <span v-else-if="user.role">{{ user.role }}</span>
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

definePageMeta({
    layout: false
});

const route = useRoute();
const hasActiveConv = computed(() => !!route.params.id);

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
const sessions = ref<any[]>(data.value?.data || []);
watch(data, (val) => { if (val?.data) sessions.value = val.data; });

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

// ---- New Message Modal ----
const router = useRouter();
const showNewMessage = ref(false);
const showFilters = ref(false);
const searchQuery = ref('');
const activeClass = ref('');
const activeSpec = ref('');
const searchResults = ref<any[]>([]);
const searchLoading = ref(false);
const startingChat = ref(false);
const filterClasses = ref<any[]>([]);
const filterSpecs = ref<any[]>([]);
const loadingFilters = ref(false);

async function fetchFilters() {
    if (filterClasses.value.length) return;
    loadingFilters.value = true;
    try {
        const res = await $fetch<any>('/api/classes', { headers: Object.fromEntries(headers.entries()) });
        filterClasses.value = res.data?.classes || [];
        filterSpecs.value = res.data?.specs || [];
    } finally {
        loadingFilters.value = false;
    }
}

async function fetchUsers() {
    searchLoading.value = true;
    try {
        const res = await $fetch<any>('/api/users/search', {
            headers: Object.fromEntries(headers.entries()),
            query: {
                search: searchQuery.value,
                class: activeClass.value,
                spec: activeSpec.value,
            },
        });
        searchResults.value = res.data || [];
    } finally {
        searchLoading.value = false;
    }
}

function openNewMessage() {
    showNewMessage.value = true;
    fetchFilters();
    fetchUsers();
}

function closeNewMessage() {
    showNewMessage.value = false;
    showFilters.value = false;
    searchQuery.value = '';
    activeClass.value = '';
    activeSpec.value = '';
    searchResults.value = [];
}

async function startConversation(userId: string) {
    startingChat.value = true;
    try {
        const res = await $fetch<any>('/api/chat/start', {
            method: 'POST',
            headers: Object.fromEntries(headers.entries()),
            body: { targetUserId: userId },
        });
        closeNewMessage();
        router.push(`/Messages/${res.data.sessionId}`);
    } finally {
        startingChat.value = false;
    }
}

let searchDebounce: ReturnType<typeof setTimeout>;
watch([searchQuery, activeClass, activeSpec], () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(fetchUsers, 300);
});

// ---- Live session list via WebSocket ----
const { connect, on } = useChat();

async function refreshSession(sessionId: string) {
    const res = await $fetch<any>('/api/chat/session', { headers: Object.fromEntries(headers.entries()) });
    const updated = (res?.data || []).find((s: any) => s.id === sessionId);
    if (!updated) return;
    const idx = sessions.value.findIndex((s: any) => s.id === sessionId);
    if (idx !== -1) {
        sessions.value.splice(idx, 1);
    }
    sessions.value.unshift(updated);
}

let unsubNewMessage: (() => void) | null = null;

onMounted(() => {
    const token = useCookie('auth_token').value;
    if (token) connect(token as string);

    unsubNewMessage = on('new_message', async (data: any) => {
        const sessionId = data.message?.sessionId;
        if (!sessionId) return;

        const existing = sessions.value.find((s: any) => s.id === sessionId);
        if (existing) {
            // Update in place and move to top
            existing.lastMessage = {
                content: data.message.content,
                senderId: data.message.senderId,
            };
            existing.updatedAt = data.message.createdAt;
            // Increment unread if not currently viewing this session
            if (route.params.id !== sessionId && data.message.senderId !== currentUserId.value) {
                existing.unreadCount = (existing.unreadCount || 0) + 1;
            }
            // Move to top
            const idx = sessions.value.indexOf(existing);
            if (idx > 0) {
                sessions.value.splice(idx, 1);
                sessions.value.unshift(existing);
            }
        } else {
            // New conversation — fetch full session info and prepend
            await refreshSession(sessionId);
        }
    });
});

onUnmounted(() => {
    unsubNewMessage?.();
});
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

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
    transition: transform 0.2s ease;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
    transform: scale(0.95) translateY(8px);
}

.slide-enter-active,
.slide-leave-active {
    transition: max-height 0.2s ease, opacity 0.2s ease;
    max-height: 300px;
    overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>
