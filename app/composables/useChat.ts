import { ref } from 'vue';

export const useChat = () => {
    const ws = ref<WebSocket | null>(null);
    const isConnected = ref(false);

    // Global state
    const currentSessionId = ref<string | null>(null);

    // Listeners
    const onMessage = ref<((msg: any) => void) | null>(null);
    const onMessageEdited = ref<((msg: any) => void) | null>(null);
    const onMessageDeleted = ref<((msg: any) => void) | null>(null);
    const onTypingStart = ref<((data: { userId: string, sessionId: string }) => void) | null>(null);
    const onTypingStop = ref<((data: { userId: string, sessionId: string }) => void) | null>(null);
    const onReactionAdded = ref<((data: any) => void) | null>(null);
    const onReactionRemoved = ref<((data: any) => void) | null>(null);
    const onReadReceipt = ref<((data: any) => void) | null>(null);

    const connect = (token: string) => {
        if (ws.value) return;

        // Determine protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws`;

        ws.value = new WebSocket(wsUrl);

        ws.value.onopen = () => {
            isConnected.value = true;
            console.log('[useChat] Connected');
        };

        ws.value.onclose = () => {
            isConnected.value = false;
            console.log('[useChat] Disconnected');
            ws.value = null;
            // Basic reconnection logic can be added here
        };

        ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'new_message':
                        onMessage.value?.(data.message);
                        break;
                    case 'message_edited':
                        onMessageEdited.value?.(data);
                        break;
                    case 'message_deleted':
                        onMessageDeleted.value?.({ messageId: data.messageId, sessionId: data.sessionId });
                        break;
                    case 'typing_start':
                        onTypingStart.value?.(data);
                        break;
                    case 'typing_stop':
                        onTypingStop.value?.(data);
                        break;
                    case 'reaction_added':
                        onReactionAdded.value?.(data);
                        break;
                    case 'reaction_removed':
                        onReactionRemoved.value?.(data);
                        break;
                    case 'read_receipt':
                        onReadReceipt.value?.(data);
                        break;
                }
            } catch (e) {
                console.error('[useChat] Failed to parse message', e);
            }
        };
    };

    const disconnect = () => {
        if (ws.value) {
            ws.value.close();
            ws.value = null;
        }
    };

    const sendAction = (type: string, data: any) => {
        if (!ws.value || !isConnected.value) {
            console.warn('[useChat] Cannot send, not connected');
            return;
        }

        const token = useCookie('auth_token').value;
        const payload = JSON.stringify({
            type,
            token,
            sessionId: currentSessionId.value,
            ...data
        });

        ws.value.send(payload);
    };

    const joinRoom = (sessionId: string) => {
        currentSessionId.value = sessionId;
        sendAction('join_room', {});
    };

    const leaveRoom = (sessionId: string) => {
        sendAction('leave_room', { sessionId });
        if (currentSessionId.value === sessionId) {
            currentSessionId.value = null;
        }
    };

    const sendMessage = (content: string, replyToId?: string) => {
        sendAction('send_message', { content, replyToId });
    };

    // Other actions wrappers
    const editMessage = (messageId: string, content: string) => sendAction('edit_message', { messageId, content });
    const deleteMessage = (messageId: string) => sendAction('delete_message', { messageId });
    const addReaction = (messageId: string, emoji: string) => sendAction('add_reaction', { messageId, emoji });
    const removeReaction = (reactionId: string) => sendAction('remove_reaction', { reactionId });
    const startTyping = () => sendAction('typing_start', {});
    const stopTyping = () => sendAction('typing_stop', {});
    const markRead = () => sendAction('mark_read', {});

    return {
        isConnected,
        currentSessionId,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        startTyping,
        stopTyping,
        markRead,

        // Listeners for components to bind to
        onMessage,
        onMessageEdited,
        onMessageDeleted,
        onTypingStart,
        onTypingStop,
        onReactionAdded,
        onReactionRemoved,
        onReadReceipt
    };
};
