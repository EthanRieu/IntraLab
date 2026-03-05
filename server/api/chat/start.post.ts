import prisma from '../../utils/prisma';
import { requireAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
    try {
        const user = await requireAuth(event);
        const body = await readBody(event);
        const { targetUserId } = body;

        if (!targetUserId) {
            throw createError({ statusCode: 400, statusMessage: 'Identifiant du destinataire manquant' });
        }

        if (user.userId === targetUserId) {
            throw createError({ statusCode: 400, statusMessage: 'Vous ne pouvez pas démarrer une discussion avec vous-même' });
        }

        // Check if target user exists
        const targetUser = await prisma.users.findUnique({
            where: { id: targetUserId }
        });

        if (!targetUser || targetUser.deleted || !targetUser.active) {
            throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' });
        }

        // Check if a session already exists between these EXACT two users
        // This is a bit tricky: find a session where BOTH users are participants, and NO ONE ELSE is.
        // For a 2-person chat, it's simpler:
        const existingSessions = await prisma.chat_session.findMany({
            where: {
                participants: {
                    some: { user_id: user.userId }
                }
            },
            include: {
                participants: true
            }
        });

        let foundSessionId = null;

        for (const session of existingSessions) {
            if (session.participants.length === 2) {
                const hasTarget = session.participants.some(p => p.user_id === targetUserId);
                if (hasTarget) {
                    foundSessionId = session.id;
                    break;
                }
            }
        }

        if (foundSessionId) {
            return {
                success: true,
                data: { sessionId: foundSessionId }
            };
        }

        // If no session exists, create one
        const newSession = await prisma.chat_session.create({
            data: {
                participants: {
                    create: [
                        { user_id: user.userId },
                        { user_id: targetUserId }
                    ]
                }
            }
        });

        return {
            success: true,
            data: { sessionId: newSession.id }
        };

    } catch (error: any) {
        console.error('Erreur lors du démarrage du chat:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erreur interne du serveur' });
    }
});
