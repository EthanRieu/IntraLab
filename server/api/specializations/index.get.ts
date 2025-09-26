import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  try {
    // L'authentification est optionnelle pour cette route publique
    await optionalAuth(event);

    // Récupérer toutes les spécialisations
    const specializations = await getAllSpecializations();

    return {
      success: true,
      data: { specializations },
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des spécialisations:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer toutes les spécialisations
async function getAllSpecializations() {
  const specializations = await prisma.spec.findMany({
    where: {
      active: true,
      deleted: false,
    },
    include: {
      _count: {
        select: {
          users: {
            where: {
              active: true,
              deleted: false,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return specializations.map((spec: any) => ({
    id: spec.id,
    slug: spec.slug,
    name: spec.name,
    studentCount: spec._count.users,
    createdAt: spec.created_at,
    updatedAt: spec.updated_at,
  }));
}
