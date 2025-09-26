import prisma from '../../utils/prisma';
import {
  requireOwnershipOrAdmin,
  handleAuthError,
} from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // Récupérer l'ID depuis les paramètres
    const userId = getRouterParam(event, 'id');

    if (!userId || !validateUUID(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID utilisateur invalide',
      });
    }

    // Vérifier les permissions (propriétaire, RP ou Admin)
    await requireOwnershipOrAdmin(() => userId)(event);

    // Récupérer l'utilisateur par ID
    const user = await getUserById(userId);

    return {
      success: true,
      data: { user },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    handleAuthError(error);
  }
});

// Fonction pour récupérer un utilisateur par ID
async function getUserById(userId: string) {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
      deleted: false,
    },
    include: {
      roles: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      classes: {
        select: {
          id: true,
          slug: true,
          name: true,
          level: true,
        },
      },
      spec: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      // Inclure quelques statistiques
      _count: {
        select: {
          loan: true,
          notifications: {
            where: { read: false },
          },
          store_store_seller_idTousers: {
            where: { status: 'active' },
          },
        },
      },
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé',
    });
  }

  // Formater les données de retour
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    active: user.active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    role: {
      id: user.roles.id,
      slug: user.roles.slug,
      name: user.roles.name,
    },
    class: user.classes
      ? {
          id: user.classes.id,
          slug: user.classes.slug,
          name: user.classes.name,
          level: user.classes.level,
        }
      : null,
    specialization: user.spec
      ? {
          id: user.spec.id,
          slug: user.spec.slug,
          name: user.spec.name,
        }
      : null,
    stats: {
      activeLoans: user._count.loan,
      unreadNotifications: user._count.notifications,
      activeListings: user._count.store_store_seller_idTousers,
    },
  };
}
