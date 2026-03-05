import prisma from './prisma';
import { encryptMessage } from './crypto';

/**
 * Sends an automated chat message between two users.
 * Creates a new chat session if one does not exist between them.
 */
export async function sendAutomatedChatMessage(
    senderId: string,
    recipientId: string,
    messageContent: string
) {
    try {
        // 1. Find if a session already exists between EXACTLY these two users
        const existingSessions = await prisma.chat_session.findMany({
            where: {
                participants: {
                    some: { user_id: senderId }
                }
            },
            include: {
                participants: true
            }
        });

        let sessionId = null;

        for (const session of existingSessions) {
            if (session.participants.length === 2) {
                const hasRecipient = session.participants.some(p => p.user_id === recipientId);
                if (hasRecipient) {
                    sessionId = session.id;
                    break;
                }
            }
        }

        // 2. If no session exists, create a new one
        if (!sessionId) {
            const newSession = await prisma.chat_session.create({
                data: {
                    participants: {
                        create: [
                            { user_id: senderId },
                            { user_id: recipientId }
                        ]
                    }
                }
            });
            sessionId = newSession.id;
        }

        // 3. Encrypt the message content
        const encrypted = encryptMessage(messageContent);

        // 4. Create the chat message
        await prisma.chat_message.create({
            data: {
                session_id: sessionId,
                sender_id: senderId,
                content: encrypted.content,
                iv: encrypted.iv
            }
        });

        // 5. Update last_read_time for the sender (since they "sent" it)
        // This ensures the sender doesn't see their own automated message as unread.
        await prisma.chat_participant.update({
            where: {
                session_id_user_id: {
                    session_id: sessionId,
                    user_id: senderId
                }
            },
            data: {
                last_read_time: new Date()
            }
        });

    } catch (error) {
        console.error('Erreur lors de l’envoi du message chat automatisé :', error);
        // We catch and log the error so it doesn't break the main flow (e.g. loan approval)
    }
}
