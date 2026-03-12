import prisma from '../../utils/prisma';
import { requireAuth } from '../../middleware/auth';
import { decryptMessage } from '../../utils/crypto';

export default defineEventHandler(async (event) => {
    try {
        const user = await requireAuth(event);

        // Fetch all sessions the user is part of
        const sessions = await prisma.chat_session.findMany({
            where: {
                participants: {
                    some: { user_id: user.userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                profile_picture_url: true,
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1, // Just get the latest message for the preview
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        // Format the response
        const formattedSessions = sessions.map((session: any) => {
            // Decrypt the last message if it exists
            const lastMessage = session.messages[0];
            let decryptedLastMessage = null;
            if (lastMessage) {
                decryptedLastMessage = {
                    id: lastMessage.id,
                    sessionId: lastMessage.session_id,
                    senderId: lastMessage.sender_id,
                    content: decryptMessage(lastMessage.content, lastMessage.iv),
                    createdAt: lastMessage.created_at,
                    updatedAt: lastMessage.updated_at
                };
            }

            // Get the other participant's details (assuming 1-on-1 chat for 'otherParticipant')
            const otherParticipant = session.participants.find((p: any) => p.user.id !== user.userId)?.user;

            // Calculate unread count
            const unreadCount = session.messages.filter((m: any) => {
                const myParticipant = session.participants.find((p: any) => p.user_id === user.userId);
                if (!myParticipant || !myParticipant.last_read_time) return true; // Default to unread if no read time
                return new Date(m.created_at) > new Date(myParticipant.last_read_time);
            }).length;

            return {
                id: session.id,
                type: session.type || 'direct',
                updatedAt: session.updated_at,
                lastMessage: decryptedLastMessage,
                otherParticipant: otherParticipant ? {
                    id: otherParticipant.id,
                    firstName: otherParticipant.first_name,
                    lastName: otherParticipant.last_name,
                    avatar: otherParticipant.profile_picture_url
                } : null,
                unreadCount: unreadCount
            };
        });

        // Sort by most recent message, then by session update time
        const sortedFormattedSessions = formattedSessions.sort((a: any, b: any) => {
            const timeA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : new Date(a.updatedAt).getTime();
            const timeB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : new Date(b.updatedAt).getTime();
            return timeB - timeA;
        });

        return {
            success: true,
            data: sortedFormattedSessions
        };

    } catch (error: any) {
        console.error('Erreur lors de la récupération des sessions:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erreur interne du serveur' });
    }
});
