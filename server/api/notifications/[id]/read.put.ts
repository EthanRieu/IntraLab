import prisma from '../../../utils/prisma';
import { requireAuth, handleAuthError } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête PUT
    assertMethod(event, 'PUT');

    // Récupérer l'ID depuis les paramètres
    const notificationId = getRouterParam(event, 'id');

    if (!notificationId || !validateUUID(notificationId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de notification invalide',
      });
    }

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Marquer la notification comme lue
    const notification = await markAsRead(notificationId, user.userId);

    if (!notification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Notification non trouvée ou accès refusé',
      });
    }

    return {
      success: true,
      message: 'Notification marquée comme lue',
      data: { notification },
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    handleAuthError(error);
  }
});

// Fonction pour marquer une notification comme lue
async function markAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notifications.update({
      where: {
        id: notificationId,
        user_id: userId, // S'assurer que l'utilisateur peut seulement marquer ses propres notifications
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.related_id,
      relatedType: notification.related_type,
      read: notification.read,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    };
  } catch (error) {
    // Si l'erreur est due à un enregistrement non trouvé, retourner null
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
}
