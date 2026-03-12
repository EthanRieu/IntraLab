<template>
    <div class="flex flex-col h-full relative w-full">
        <!-- Top Glow -->
        <div class="absolute top-0 right-0 w-1/2 h-32 bg-primary-500/10 blur-[100px] pointer-events-none"></div>

        <!-- Header: sticky at top so it stays visible when keyboard opens -->
        <div
            class="sticky top-0 p-4 md:p-6 border-b border-white/10 shrink-0 z-10 flex justify-between items-center bg-[#1A1A1A]/80 backdrop-blur-md">
            <div class="flex items-center gap-3">
                <!-- Back button — mobile only -->
                <NuxtLink to="/Messages"
                    class="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </NuxtLink>
                <div class="h-10 w-10 rounded-full shrink-0 border border-white/20 overflow-hidden">
                    <img v-if="sessionInfo?.otherParticipant?.avatar"
                        :src="sessionInfo.otherParticipant.avatar"
                        :alt="chatName"
                        class="h-full w-full object-cover rounded-full" />
                    <div v-else
                        class="h-full w-full bg-[#f8f9fa] flex items-center justify-center font-bold">
                        <span class="bg-custom-gradient bg-clip-text text-transparent text-lg tracking-wider">
                            {{ getInitials(chatName) }}
                        </span>
                    </div>
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white">{{ chatName }}</h2>
                    <p class="text-xs text-gray-500">En ligne</p>
                </div>
            </div>
        </div>

        <!-- Messages Area: min-h-0 prevents flex overflow, allows proper keyboard resize -->
        <div ref="messagesContainer"
            class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4 relative z-10"
            @scroll="handleScroll">
            <div v-if="pending" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
            </div>

            <div v-if="!messages.length && !pending"
                class="flex-1 flex items-center justify-center flex-col text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 text-white/10" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Commencez la discussion !</p>
                <p class="text-xs mt-1">Vos messages sont chiffrés de bout en bout.</p>
            </div>

            <!-- Render Messages -->
            <div v-for="(msg, index) in messages" :key="msg.id" class="flex w-full group relative"
                :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
                @touchstart="onTouchStart(msg)"
                @touchend="onTouchEnd"
                @touchmove="onTouchEnd">

                <div class="max-w-[75%] flex flex-col relative"
                    :class="msg.senderId === currentUserId ? 'items-end' : 'items-start'">

                    <!-- Reply Context (Optional) -->
                    <div v-if="msg.replyToId"
                        class="mb-1 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-t-xl rounded-br-sm border-l-2 border-primary-500 max-w-full truncate opacity-70">
                        En réponse à un message...
                    </div>

                    <!-- Message Bubble -->
                    <div class="px-5 py-3 rounded-2xl relative shadow-md transition-shadow" :class="msg.senderId === currentUserId
                        ? 'bg-white/10 text-white rounded-tr-sm'
                        : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-white/5'">

                        <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed"
                            :class="msg.isDeleted ? 'italic opacity-60' : ''">
                            <template v-for="(segment, i) in parseMessageLinks(msg.content)" :key="i">
                                <a v-if="segment.isLink" :href="segment.text" target="_blank" rel="noopener noreferrer"
                                    class="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors">{{
                                        segment.text }}</a>
                                <span v-else>{{ segment.text }}</span>
                            </template>
                        </p>

                        <!-- Edit Badge -->
                        <span v-if="msg.isEdited && !msg.isDeleted"
                            class="text-[10px] opacity-60 ml-2 italic">(modifié)</span>

                        <!-- Timestamp -->
                        <span class="text-[10px] opacity-50 block mt-1 text-right"
                            :class="msg.senderId === currentUserId ? 'text-primary-200' : 'text-gray-400'">
                            {{ formatTime(msg.createdAt) }}
                        </span>
                    </div>

                    <!-- Reactions Overlay -->
                    <div v-if="msg.reactions && msg.reactions.length" class="absolute -bottom-3 flex gap-1 z-20"
                        :class="msg.senderId === currentUserId ? 'right-4' : 'left-4'">
                        <div v-for="reaction in groupReactions(msg.reactions)" :key="reaction.emoji"
                            class="bg-[#1A1A1A] border border-white/10 rounded-full px-2 py-0.5 text-xs flex items-center shadow-lg gap-1 cursor-pointer hover:bg-white/10 transition-colors"
                            @click="toggleReaction(msg.id, reaction.emoji)">
                            <span>{{ reaction.emoji }}</span>
                            <span class="text-[10px] text-gray-400" v-if="reaction.count > 1">{{ reaction.count
                            }}</span>
                        </div>
                    </div>

                    <!-- Action Menu (Hover) -->
                    <div class="absolute opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 top-1/2 -translate-y-1/2"
                        :class="msg.senderId === currentUserId ? '-left-20' : '-right-20'">
                        <button @click="setReplyTo(msg)"
                            class="p-1.5 bg-[#1A1A1A] border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>

                        <div class="relative flex">
                            <button @click="showReactionPicker(msg.id)"
                                class="p-1.5 bg-[#1A1A1A] border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            <!-- Emoji Reaction Picker Popup -->
                            <div v-if="activeReactionMsgId === msg.id"
                                class="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-1 z-50 bg-[#1A1A1A] border border-white/10 rounded-xl p-1.5 shadow-2xl">
                                <button v-for="emoji in ['👍', '❤️', '😂', '😮', '😢', '🔥']" :key="emoji"
                                    @click.stop="addReaction(msg.id, emoji); activeReactionMsgId = null"
                                    class="text-xl hover:bg-white/10 hover:scale-125 w-8 h-8 flex items-center justify-center rounded-lg transition-all">
                                    {{ emoji }}
                                </button>
                            </div>
                        </div>
                        <template v-if="msg.senderId === currentUserId && !msg.isDeleted">
                            <button @click="editMsg(msg)"
                                class="p-1.5 bg-[#1A1A1A] border border-white/10 rounded-full text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-colors shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button @click="deleteMsg(msg.id)"
                                class="p-1.5 bg-[#1A1A1A] border border-white/10 rounded-full text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </template>
                    </div>

                </div>
            </div>

            <!-- Typing Indicator Bubble -->
            <div v-if="typingUser" class="flex w-full group relative justify-start">
                <div class="max-w-[75%] flex flex-col relative items-start">
                    <div class="flex items-center gap-2 mb-1 pl-1">
                        <div
                            class="h-6 w-6 rounded-full bg-[#f8f9fa] flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-white/20">
                            <span class="bg-custom-gradient bg-clip-text text-transparent">
                                {{ getInitials(chatName) }}
                            </span>
                        </div>
                        <span class="text-[11px] text-gray-400 font-medium">{{ chatName }} est en train
                            d'écrire...</span>
                    </div>
                    <div
                        class="px-4 py-3 bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm border border-white/5 relative shadow-md w-fit flex h-[42px] items-center">
                        <div class="typing-indicator flex gap-1">
                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style="animation-delay: 0s"></span>
                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style="animation-delay: 0.1s"></span>
                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style="animation-delay: 0.2s"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Long-Press Bottom Sheet -->
        <Teleport to="body">
            <Transition name="sheet">
                <div v-if="activeMobileMenuMsg" class="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
                    @click.self="activeMobileMenuMsg = null">
                    <div class="absolute inset-0 bg-black/50" @click="activeMobileMenuMsg = null"></div>
                    <div class="relative bg-[#1A1A1A] border-t border-white/10 rounded-t-2xl p-4 pb-8 space-y-1">
                        <!-- Emoji reactions row -->
                        <div class="flex justify-around pb-3 mb-1 border-b border-white/10">
                            <button v-for="emoji in ['👍', '❤️', '😂', '😮', '😢', '🔥']" :key="emoji"
                                @click="addReaction(activeMobileMenuMsg!.id, emoji); activeMobileMenuMsg = null"
                                class="text-2xl w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all active:scale-125">
                                {{ emoji }}
                            </button>
                        </div>
                        <!-- Reply -->
                        <button @click="setReplyTo(activeMobileMenuMsg!); activeMobileMenuMsg = null"
                            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-white/5 transition-colors text-left">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Répondre
                        </button>
                        <!-- Edit / Delete (own messages only) -->
                        <template v-if="activeMobileMenuMsg!.senderId === currentUserId && !activeMobileMenuMsg!.isDeleted">
                            <button @click="editMsg(activeMobileMenuMsg!); activeMobileMenuMsg = null"
                                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:bg-white/5 transition-colors text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Modifier
                            </button>
                            <button @click="deleteMsg(activeMobileMenuMsg!.id); activeMobileMenuMsg = null"
                                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer
                            </button>
                        </template>
                        <!-- Cancel -->
                        <button @click="activeMobileMenuMsg = null"
                            class="w-full flex items-center justify-center px-4 py-3 mt-1 rounded-xl text-gray-500 hover:bg-white/5 transition-colors text-sm font-medium">
                            Annuler
                        </button>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Input Area: sticky at bottom so it stays above the keyboard -->
        <div class="sticky bottom-0 p-4 md:p-6 border-t border-white/10 bg-[#1A1A1A] z-20">

            <!-- Reply Context Banner -->
            <div v-if="replyingTo"
                class="mb-3 px-4 py-2 bg-primary-500/10 border-l-2 border-primary-500 rounded-lg flex justify-between items-center text-sm">
                <div class="truncate mr-4">
                    <span class="font-bold text-primary-300 mr-2">Réponse:</span>
                    <span class="text-gray-300 truncate">{{ replyingTo.content }}</span>
                </div>
                <button @click="replyingTo = null" class="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form @submit.prevent="submitMessage" class="flex items-end gap-3 relative">
                <!-- Input Emoji Picker -->
                <div v-if="showInputEmojiPicker"
                    class="absolute bottom-full left-0 mb-4 bg-[#1A1A1A] border border-white/10 rounded-xl p-3 shadow-2xl z-50 w-[280px]">
                    <div class="flex flex-wrap gap-1">
                        <button
                            v-for="emoji in ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '👎', '❤️', '🔥', '🎉', '👀']"
                            :key="emoji" @click.prevent="addEmojiToInput(emoji)" type="button"
                            class="text-xl hover:bg-white/10 hover:scale-125 w-9 h-9 flex items-center justify-center rounded-lg transition-all">
                            {{ emoji }}
                        </button>
                    </div>
                </div>

                <button type="button" @click="showInputEmojiPicker = !showInputEmojiPicker"
                    class="p-3 transition-colors shrink-0"
                    :class="showInputEmojiPicker ? 'text-primary-400' : 'text-gray-400 hover:text-white'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                <div
                    class="flex-1 bg-[#1A1A1A] rounded-2xl border border-white/5 focus-within:border-primary-500/50 transition-colors overflow-hidden flex items-end shadow-inner">
                    <textarea v-model="newMessage" @keydown.enter.exact.prevent="submitMessage" @input="handleTyping"
                        rows="1" placeholder="Écrivez un message..."
                        class="w-full bg-transparent text-white px-4 py-3.5 focus:outline-none resize-none max-h-32 text-[15px] custom-scrollbar"
                        style="min-height: 52px;"></textarea>
                </div>

                <button type="submit" :disabled="!newMessage.trim()"
                    class="h-[52px] w-[52px] rounded-2xl bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useChat } from '~/composables/useChat';

interface Message {
    id: string;
    sessionId: string;
    content: string;
    senderId: string;
    isEdited: boolean;
    isDeleted: boolean;
    replyToId: string | null;
    createdAt: string;
    reactions: any[];
}

const route = useRoute();
const sessionId = route.params.id as string;

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
const { data: fetchRes, pending } = await useFetch<any>(`/api/chat/${sessionId}/messages`, { headers });
const messages = ref<Message[]>(fetchRes.value?.data?.messages || []);

const { data: sessionRes } = await useFetch<any>('/api/chat/session', { headers });
const sessionInfo = sessionRes.value?.data?.find((s: any) => s.id === sessionId);

const chatName = computed(() => {
    if (sessionInfo && sessionInfo.otherParticipant) {
        return `${sessionInfo.otherParticipant.firstName} ${sessionInfo.otherParticipant.lastName}`;
    }
    return 'Discussion';
});

const newMessage = ref((route.query.msg as string) || '');
const messagesContainer = ref<HTMLElement | null>(null);

// Chat state
const typingUser = ref(false);
let typingTimeout: NodeJS.Timeout;

// Actions state
const replyingTo = ref<Message | null>(null);
const editingMsgId = ref<string | null>(null);
const activeReactionMsgId = ref<string | null>(null);

const showInputEmojiPicker = ref(false);
const addEmojiToInput = (emoji: string) => {
    newMessage.value += emoji;
};

const {
    connect, joinRoom, leaveRoom, sendMessage, editMessage, deleteMessage, addReaction, markRead, startTyping, stopTyping, on
} = useChat();

const toggleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
};

const unsubscribers: (() => void)[] = [];

onMounted(() => {
    scrollToBottom();

    // Connect WebSocket (singleton — safe to call multiple times)
    const token = useCookie('auth_token').value;
    if (token) {
        connect(token as string);
        setTimeout(() => {
            joinRoom(sessionId);
            // Mark existing messages as read when opening the conversation
            setTimeout(() => markRead(), 200);
        }, 500);
    }

    // Bind WS Events
    unsubscribers.push(on('new_message', (data: any) => {
        const msg: Message = data.message;
        if (msg.sessionId !== sessionId) return;
        if (!messages.value.some(m => m.id === msg.id)) {
            messages.value.push(msg);
            markRead();
            scrollToBottom();
        }
    }));

    unsubscribers.push(on('message_edited', (data: any) => {
        const msg = messages.value.find(m => m.id === data.messageId);
        if (msg) { msg.content = data.content; msg.isEdited = true; }
    }));

    unsubscribers.push(on('message_deleted', (data: any) => {
        const msg = messages.value.find(m => m.id === data.messageId);
        if (msg) { msg.content = 'Ce message a été supprimé.'; msg.isDeleted = true; }
    }));

    unsubscribers.push(on('typing_start', (data: any) => {
        if (data.userId !== currentUserId.value) {
            typingUser.value = true;
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => typingUser.value = false, 5000);
        }
    }));

    unsubscribers.push(on('typing_stop', (data: any) => {
        if (data.userId !== currentUserId.value) typingUser.value = false;
    }));

    unsubscribers.push(on('reaction_added', (data: any) => {
        const msg = messages.value.find(m => m.id === data.messageId);
        if (msg) {
            if (!msg.reactions) msg.reactions = [];
            msg.reactions.push(data.reaction);
        }
    }));
});

onUnmounted(() => {
    leaveRoom(sessionId);
    unsubscribers.forEach(unsub => unsub());
});

const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const handleScroll = () => { /* Logic for pagination could go here if at top */ };

// Typing Indicator Logic
let lastTypingEmit = 0;
let typingEndTimeout: NodeJS.Timeout;

const handleTyping = () => {
    const now = Date.now();
    // Throttle the startTyping emission to at most once per 2 seconds
    if (now - lastTypingEmit > 2000) {
        startTyping();
        lastTypingEmit = now;
    }

    clearTimeout(typingEndTimeout);
    typingEndTimeout = setTimeout(() => {
        stopTyping();
        lastTypingEmit = 0;
    }, 2500); // Stop typing if no keystroke for 2.5s
};

// Form Submission
const submitMessage = () => {
    showInputEmojiPicker.value = false;
    const text = newMessage.value.trim();
    if (!text) return;

    if (editingMsgId.value) {
        editMessage(editingMsgId.value, text);
        editingMsgId.value = null;
    } else {
        sendMessage(text, replyingTo.value?.id);
        replyingTo.value = null;
    }

    newMessage.value = '';

    stopTyping();
    clearTimeout(typingEndTimeout);
    lastTypingEmit = 0;
};

// Context actions
const editMsg = (msg: Message) => {
    editingMsgId.value = msg.id;
    newMessage.value = msg.content;
    replyingTo.value = null; // Can't reply and edit at same time easily visually
};
const deleteMsg = (id: string) => {
    if (confirm("Supprimer ce message ?")) {
        deleteMessage(id);
    }
};
// Helper to parse URLs into clickable links safely without v-html
const parseMessageLinks = (text: string) => {
    if (!text) return [];

    // Split the text by URL pattern, keeping the matches as elements in the array
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const parts = text.split(urlRegex);

    return parts.map(part => {
        if (part.startsWith('http://') || part.startsWith('https://')) {
            return { text: part, isLink: true };
        }
        return { text: part, isLink: false };
    });
};

const setReplyTo = (msg: Message) => {
    replyingTo.value = msg;
    editingMsgId.value = null;
};

// Mobile long-press context menu
const activeMobileMenuMsg = ref<Message | null>(null);
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

const onTouchStart = (msg: Message) => {
    longPressTimer = setTimeout(() => {
        activeMobileMenuMsg.value = msg;
    }, 500);
};

const onTouchEnd = () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
};
const showReactionPicker = (id: string) => {
    activeReactionMsgId.value = activeReactionMsgId.value === id ? null : id;
};

// Helpers
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const groupReactions = (reactions: any[]): { emoji: string, count: number }[] => {
    if (!reactions) return [];
    const grouped = reactions.reduce((acc, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([emoji, count]) => ({ emoji, count: Number(count) }));
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

textarea::-webkit-scrollbar {
    display: none;
}

.typing-indicator span {
    animation-duration: 1s;
    animation-iteration-count: infinite;
}

.sheet-enter-active,
.sheet-leave-active {
    transition: opacity 0.2s ease;
}
.sheet-enter-active .relative,
.sheet-leave-active .relative {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
    opacity: 0;
}
.sheet-enter-from .relative,
.sheet-leave-to .relative {
    transform: translateY(100%);
}
</style>
