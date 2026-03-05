import prisma from '../../../utils/prisma';
import { requireAuth } from '../../../middleware/auth';
import { decryptMessage } from '../../../utils/crypto';

export default defineEventHandler(async (event) => {
    try {
        const user = await requireAuth(event);
        const sessionId = event.context.params?.sessionId;

        if (!sessionId) {
            throw createError({ statusCode: 400, statusMessage: 'Session ID manquant' });
        }

        const query = getQuery(event);
        const page = parseInt(query.page as string || '1');
        const limit = parseInt(query.limit as string || '50');
        const skip = (page - 1) * limit;

        // Verify the user is part of this session
        const participant = await prisma.chat_participant.findUnique({
            where: {
                session_id_user_id: {
                    session_id: sessionId,
                    user_id: user.userId
                }
            }
        });

        if (!participant) {
            throw createError({ statusCode: 403, statusMessage: 'Accès non autorisé à cette discussion' });
        }

        const [messages, total] = await Promise.all([
            prisma.chat_message.findMany({
                where: { session_id: sessionId },
                include: {
                    sender: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true
                        }
                    },
                    reactions: {
                        include: {
                            user: { select: { id: true, first_name: true, last_name: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.chat_message.count({ where: { session_id: sessionId } })
        ]);

        // Mark as read natively (optional, could be done via WS instead, but good fallback)
        await prisma.chat_participant.update({
            where: { session_id_user_id: { session_id: sessionId, user_id: user.userId } },
            data: { last_read_time: new Date() }
        });

        // Format and decrypt
        const formattedMessages = messages.map(msg => {
            let content = "";
            if (msg.is_deleted) {
                content = "Ce message a été supprimé.";
            } else {
                content = decryptMessage(msg.content, msg.iv);
            }

            return {
                id: msg.id,
                sessionId: msg.session_id,
                senderId: msg.sender_id,
                senderName: `${msg.sender.first_name} ${msg.sender.last_name}`,
                content: content,
                isEdited: msg.is_edited,
                isDeleted: msg.is_deleted,
                replyToId: msg.reply_to_id,
                createdAt: msg.created_at,
                updatedAt: msg.updated_at,
                reactions: msg.reactions.map(r => ({
                    id: r.id,
                    emoji: r.emoji,
                    userId: r.user.id,
                    userName: `${r.user.first_name} ${r.user.last_name}`
                }))
            };
        });

        return {
            success: true,
            data: {
                messages: formattedMessages.reverse(), // Send oldest first to the UI (common chat behavior)
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + messages.length < total
                }
            }
        };

    } catch (error: any) {
        console.error('Erreur lors de la récupération des messages:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erreur interne du serveur' });
    }
});
