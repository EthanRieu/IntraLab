import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête PUT
    assertMethod(event, 'PUT');

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Marquer toutes les notifications comme lues
    const result = await markAllAsRead(user.userId);

    return {
      success: true,
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    handleAuthError(error);
  }
});

// Fonction pour marquer toutes les notifications d'un utilisateur comme lues
async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read: false,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });

    return {
      count: result.count,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de marquer les notifications comme lues',
    });
  }
}
