import { ref } from 'vue';

// --- Singleton WebSocket state (module-level, shared across all components) ---
let _ws: WebSocket | null = null;
let _authToken: string | null = null;
const _isConnected = ref(false);
const _currentSessionId = ref<string | null>(null);

type EventHandler = (data: any) => void;
const _handlers: Record<string, Set<EventHandler>> = {};

const _emit = (event: string, data: any) => {
    _handlers[event]?.forEach(h => h(data));
};

const _on = (event: string, handler: EventHandler): (() => void) => {
    if (!_handlers[event]) _handlers[event] = new Set();
    _handlers[event].add(handler);
    return () => _handlers[event]?.delete(handler);
};

const _sendRaw = (payload: object) => {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) return;
    _ws.send(JSON.stringify(payload));
};

// --- Exported composable ---
export const useChat = () => {
    const connect = (token: string) => {
        if (_ws && _ws.readyState !== WebSocket.CLOSED) return;
        _authToken = token;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        _ws = new WebSocket(`${protocol}//${window.location.host}/api/chat/ws`);

        _ws.onopen = () => {
            _isConnected.value = true;
            // Register this peer on the server for push notifications
            _sendRaw({ type: 'authenticate', token: _authToken });
            // Rejoin current room if any (after reconnect)
            if (_currentSessionId.value) {
                _sendRaw({ type: 'join_room', token: _authToken, sessionId: _currentSessionId.value });
            }
        };

        _ws.onclose = () => {
            _isConnected.value = false;
            _ws = null;
            // Auto-reconnect if we have a token
            if (_authToken) {
                setTimeout(() => connect(_authToken!), 3000);
            }
        };

        _ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                _emit(data.type, data);
            } catch { }
        };
    };

    const disconnect = () => {
        _authToken = null;
        _currentSessionId.value = null;
        _ws?.close();
        _ws = null;
    };

    const sendAction = (type: string, data: any = {}) => {
        const token = useCookie('auth_token').value;
        _sendRaw({ type, token, sessionId: _currentSessionId.value, ...data });
    };

    const joinRoom = (sessionId: string) => {
        _currentSessionId.value = sessionId;
        sendAction('join_room');
    };

    const leaveRoom = (sessionId: string) => {
        sendAction('leave_room', { sessionId });
        if (_currentSessionId.value === sessionId) _currentSessionId.value = null;
    };

    return {
        isConnected: _isConnected,
        currentSessionId: _currentSessionId,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        on: _on,
        sendMessage: (content: string, replyToId?: string) => sendAction('send_message', { content, replyToId }),
        editMessage: (messageId: string, content: string) => sendAction('edit_message', { messageId, content }),
        deleteMessage: (messageId: string) => sendAction('delete_message', { messageId }),
        addReaction: (messageId: string, emoji: string) => sendAction('add_reaction', { messageId, emoji }),
        removeReaction: (reactionId: string) => sendAction('remove_reaction', { reactionId }),
        startTyping: () => sendAction('typing_start'),
        stopTyping: () => sendAction('typing_stop'),
        markRead: () => sendAction('mark_read'),
    };
};
