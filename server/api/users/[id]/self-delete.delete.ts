import prisma from '../../../utils/prisma';
import { requireAuth, handleAuthError } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    assertMethod(event, 'DELETE');

    const userId = getRouterParam(event, 'id');

    if (!userId || !validateUUID(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID utilisateur invalide',
      });
    }

    // Vérifier que l'utilisateur est authentifié
    const currentUser = await requireAuth(event);

    // Un utilisateur ne peut supprimer que son propre compte
    if (currentUser.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Vous ne pouvez supprimer que votre propre compte',
      });
    }

    // Vérifier que l'utilisateur existe et n'est pas déjà supprimé
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Utilisateur non trouvé',
      });
    }

    if (existingUser.deleted) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Compte déjà supprimé',
      });
    }

    // Soft delete : deleted = true, active = false, email anonymisé
    await prisma.users.update({
      where: { id: userId },
      data: {
        deleted: true,
        active: false,
        updated_at: new Date(),
        email: `deleted_${userId}@deleted.local`,
      },
    });

    return {
      success: true,
      message: 'Votre compte a été supprimé avec succès',
    };
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    handleAuthError(error);
  }
});
