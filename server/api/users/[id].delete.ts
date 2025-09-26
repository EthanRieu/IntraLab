import prisma from '../../utils/prisma';
import { requireRP, handleAuthError } from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête DELETE
    assertMethod(event, 'DELETE');

    // Récupérer l'ID depuis les paramètres
    const userId = getRouterParam(event, 'id');

    if (!userId || !validateUUID(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID utilisateur invalide',
      });
    }

    // Vérifier les permissions (RP uniquement - suppression d'utilisateurs)
    const currentUser = await requireRP(event);

    // Empêcher l'auto-suppression
    if (currentUser.userId === userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    // Supprimer l'utilisateur (soft delete)
    const deletedUser = await deleteUser(userId);

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
      data: { user: deletedUser },
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    handleAuthError(error);
  }
});

// Fonction pour supprimer un utilisateur (soft delete)
async function deleteUser(userId: string) {
  // Vérifier que l'utilisateur existe et n'est pas déjà supprimé
  const existingUser = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        select: { slug: true, name: true },
      },
    },
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
      statusMessage: 'Utilisateur déjà supprimé',
    });
  }

  // Vérifier s'il y a des dépendances actives
  const [activeLoans, activeListings, pendingArticles] = await Promise.all([
    prisma.loan.count({
      where: {
        borrower_id: userId,
        status: { in: ['pending', 'approved'] },
        deleted: false,
      },
    }),
    prisma.store.count({
      where: {
        seller_id: userId,
        status: 'active',
      },
    }),
    prisma.user_article.count({
      where: {
        user_id: userId,
        articles: {
          status: { in: ['draft', 'pending'] },
          deleted: false,
        },
      },
    }),
  ]);

  // Avertir s'il y a des dépendances actives
  const warnings = [];
  if (activeLoans > 0) {
    warnings.push(`${activeLoans} emprunt(s) actif(s)`);
  }
  if (activeListings > 0) {
    warnings.push(`${activeListings} annonce(s) active(s)`);
  }
  if (pendingArticles > 0) {
    warnings.push(`${pendingArticles} article(s) en attente`);
  }

  // Effectuer le soft delete
  const deletedUser = await prisma.users.update({
    where: { id: userId },
    data: {
      deleted: true,
      active: false,
      updated_at: new Date(),
      // Optionnel: anonymiser l'email pour éviter les conflits
      email: `deleted_${userId}@deleted.local`,
    },
    include: {
      roles: {
        select: { slug: true, name: true },
      },
    },
  });

  // Formater la réponse
  return {
    id: deletedUser.id,
    firstName: deletedUser.first_name,
    lastName: deletedUser.last_name,
    email: existingUser.email, // Retourner l'ancien email
    role: {
      slug: deletedUser.roles.slug,
      name: deletedUser.roles.name,
    },
    deletedAt: deletedUser.updated_at,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
