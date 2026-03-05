// Registry of WebSocket peers by userId for server-side push (notifications, etc.)
const userPeers = new Map<string, Set<any>>();
const peerToUser = new Map<string, string>();

export const registerPeer = (userId: string, peer: any) => {
    if (!userPeers.has(userId)) userPeers.set(userId, new Set());
    userPeers.get(userId)!.add(peer);
    peerToUser.set(peer.id, userId);
};

export const unregisterPeer = (peerId: string) => {
    const userId = peerToUser.get(peerId);
    if (!userId) return;
    const peers = userPeers.get(userId);
    if (peers) {
        for (const p of peers) {
            if (p.id === peerId) { peers.delete(p); break; }
        }
        if (peers.size === 0) userPeers.delete(userId);
    }
    peerToUser.delete(peerId);
};

export const broadcastToUser = (userId: string, message: object) => {
    const peers = userPeers.get(userId);
    if (!peers || peers.size === 0) return;
    const json = JSON.stringify(message);
    for (const peer of peers) {
        try { peer.send(json); } catch { }
    }
};
