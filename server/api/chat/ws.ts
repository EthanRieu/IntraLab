import { verifyToken } from '../../utils/auth';
import { encryptMessage } from '../../utils/crypto';
import prisma from '../../utils/prisma';
import { registerPeer, unregisterPeer, broadcastToUser } from '../../utils/wsManager';

export default defineWebSocketHandler({
    open(peer) {
        console.log('[WS] Connection opened:', peer.id);
    },

    close(peer) {
        unregisterPeer(peer.id);
        console.log('[WS] Connection closed:', peer.id);
    },

    async message(peer, message) {
        const text = message.text();
        if (!text) return;

        try {
            const payload = JSON.parse(text);
            const { type, token, sessionId, ...data } = payload;

            // Basic authentication check
            if (!token) return;
            const user = verifyToken(token);
            if (!user) return;

            // For any action needing a session, verify they are a participant
            if (sessionId) {
                // Simple security check (could cache this per peer ID)
                const participant = await prisma.chat_participant.findUnique({
                    where: { session_id_user_id: { session_id: sessionId, user_id: user.userId } }
                });
                if (!participant) return;
            }

            switch (type) {
                case 'authenticate':
                    registerPeer(user.userId, peer);
                    break;

                case 'join_room':
                    if (sessionId) {
                        peer.subscribe(sessionId);
                        console.log(`[WS] ${user.userId} joined room ${sessionId}`);
                    }
                    break;

                case 'leave_room':
                    if (sessionId) {
                        peer.unsubscribe(sessionId);
                    }
                    break;

                case 'send_message':
                    if (sessionId && data.content) {
                        // 1. Encrypt message
                        const { content: encryptedContent, iv } = encryptMessage(data.content);

                        // 2. Save to DB
                        const newMsg = await prisma.chat_message.create({
                            data: {
                                session_id: sessionId,
                                sender_id: user.userId,
                                content: encryptedContent,
                                iv: iv,
                                reply_to_id: data.replyToId || null
                            },
                            include: {
                                sender: { select: { id: true, first_name: true, last_name: true } }
                            }
                        });

                        // 3. Update session updated_at
                        await prisma.chat_session.update({
                            where: { id: sessionId },
                            data: { updated_at: new Date() }
                        });

                        // 4. Broadcast to room (including self so UI updates, or logic can handle)
                        const broadcastPayload = {
                            type: 'new_message',
                            message: {
                                id: newMsg.id,
                                sessionId: newMsg.session_id,
                                senderId: newMsg.sender_id,
                                senderName: `${newMsg.sender.first_name} ${newMsg.sender.last_name}`,
                                content: data.content, // broadcast decrypted content to the current participants over WS
                                isEdited: newMsg.is_edited,
                                isDeleted: newMsg.is_deleted,
                                replyToId: newMsg.reply_to_id,
                                createdAt: newMsg.created_at,
                                updatedAt: newMsg.updated_at,
                                reactions: []
                            }
                        };

                        // 4. Send confirmation to sender
                        peer.send(JSON.stringify(broadcastPayload));

                        // 5. Deliver new_message directly to all other participants via wsManager
                        // (more reliable than peer.publish pub/sub which can lose subscriptions)
                        const recipients = await prisma.chat_participant.findMany({
                            where: { session_id: sessionId, user_id: { not: user.userId } }
                        });
                        for (const recipient of recipients) {
                            broadcastToUser(recipient.user_id, broadcastPayload);
                        }
                    }
                    break;

                case 'typing_start':
                    if (sessionId) {
                        const payload = JSON.stringify({
                            type: 'typing_start',
                            userId: user.userId,
                            sessionId: sessionId
                        });
                        peer.publish(sessionId, payload);
                    }
                    break;

                case 'typing_stop':
                    if (sessionId) {
                        const payload = JSON.stringify({
                            type: 'typing_stop',
                            userId: user.userId,
                            sessionId: sessionId
                        });
                        peer.publish(sessionId, payload);
                    }
                    break;

                case 'edit_message':
                    if (sessionId && data.messageId && data.content) {
                        // Verify ownership
                        const msg = await prisma.chat_message.findUnique({ where: { id: data.messageId } });
                        if (msg && msg.sender_id === user.userId && !msg.is_deleted) {
                            const { content: eContent, iv } = encryptMessage(data.content);
                            const updatedMsg = await prisma.chat_message.update({
                                where: { id: data.messageId },
                                data: { content: eContent, iv: iv, is_edited: true, updated_at: new Date() }
                            });

                            const broadcastPayload = JSON.stringify({
                                type: 'message_edited',
                                messageId: updatedMsg.id,
                                sessionId,
                                content: data.content,
                                updatedAt: updatedMsg.updated_at
                            });
                            peer.publish(sessionId, broadcastPayload);
                            peer.send(broadcastPayload);
                        }
                    }
                    break;

                case 'delete_message':
                    if (sessionId && data.messageId) {
                        const msg = await prisma.chat_message.findUnique({ where: { id: data.messageId } });
                        if (msg && msg.sender_id === user.userId) {
                            // Delete content in DB
                            await prisma.chat_message.update({
                                where: { id: data.messageId },
                                data: { content: '', is_deleted: true, updated_at: new Date() }
                            });

                            const broadcastPayload = JSON.stringify({
                                type: 'message_deleted',
                                messageId: data.messageId,
                                sessionId
                            });
                            peer.publish(sessionId, broadcastPayload);
                            peer.send(broadcastPayload);
                        }
                    }
                    break;

                case 'add_reaction':
                    if (sessionId && data.messageId && data.emoji) {
                        // Upsert doesn't work well with compound unique, so we can try creating
                        try {
                            const reaction = await prisma.chat_reaction.create({
                                data: {
                                    message_id: data.messageId,
                                    user_id: user.userId,
                                    emoji: data.emoji
                                },
                                include: {
                                    user: { select: { id: true, first_name: true, last_name: true } }
                                }
                            });

                            const broadcastPayload = JSON.stringify({
                                type: 'reaction_added',
                                sessionId,
                                messageId: data.messageId,
                                reaction: {
                                    id: reaction.id,
                                    emoji: reaction.emoji,
                                    userId: reaction.user.id,
                                    userName: `${reaction.user.first_name} ${reaction.user.last_name}`
                                }
                            });
                            peer.publish(sessionId, broadcastPayload);
                            peer.send(broadcastPayload);
                        } catch (e) {
                            // Probably already reacted with this emoji
                        }
                    }
                    break;

                case 'remove_reaction':
                    if (sessionId && data.reactionId) {
                        const reaction = await prisma.chat_reaction.findUnique({ where: { id: data.reactionId } });
                        if (reaction && reaction.user_id === user.userId) {
                            await prisma.chat_reaction.delete({ where: { id: data.reactionId } });

                            const broadcastPayload = JSON.stringify({
                                type: 'reaction_removed',
                                sessionId,
                                messageId: reaction.message_id,
                                reactionId: data.reactionId
                            });
                            peer.publish(sessionId, broadcastPayload);
                            peer.send(broadcastPayload);
                        }
                    }
                    break;

                case 'mark_read':
                    if (sessionId) {
                        await prisma.chat_participant.update({
                            where: { session_id_user_id: { session_id: sessionId, user_id: user.userId } },
                            data: { last_read_time: new Date() }
                        });

                        const broadcastPayload = JSON.stringify({
                            type: 'read_receipt',
                            sessionId,
                            userId: user.userId,
                            lastReadTime: new Date()
                        });
                        peer.publish(sessionId, broadcastPayload);
                        // Notify the reader so the header badge can be cleared
                        peer.send(JSON.stringify({ type: 'messages_marked_read', sessionId }));
                    }
                    break;
            }

        } catch (e) {
            console.error('[WS] Error processing message', e);
        }
    }
});
