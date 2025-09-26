import prisma from '../../../utils/prisma';
import { optionalAuth } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // L'authentification est optionnelle pour cette route publique
    await optionalAuth(event);

    // Récupérer l'ID de la classe depuis les paramètres
    const classId = getRouterParam(event, 'id');

    if (!classId || !validateUUID(classId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de classe invalide',
      });
    }

    // Récupérer les spécialisations pour la classe
    const result = await getSpecializationsByClass(classId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des spécialisations:', error);

    if ((error as any).statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer les spécialisations d'une classe
async function getSpecializationsByClass(classId: string) {
  // Vérifier que la classe existe et a des spécialisations
  const classInfo = await prisma.classes.findUnique({
    where: {
      id: classId,
      active: true,
      deleted: false,
    },
  });

  if (!classInfo) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Classe non trouvée',
    });
  }

  if (!classInfo.has_specialization) {
    return {
      class: {
        id: classInfo.id,
        slug: classInfo.slug,
        name: classInfo.name,
        level: classInfo.level,
        hasSpecialization: false,
      },
      specializations: [],
    };
  }

  // Récupérer les spécialisations disponibles pour cette classe
  // Note: Le schéma ne lie pas directement les spécialisations aux classes
  // On récupère toutes les spécialisations actives
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
              class_id: classId,
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

  return {
    class: {
      id: classInfo.id,
      slug: classInfo.slug,
      name: classInfo.name,
      level: classInfo.level,
      hasSpecialization: classInfo.has_specialization,
    },
    specializations: specializations.map((spec: any) => ({
      id: spec.id,
      slug: spec.slug,
      name: spec.name,
      studentCount: spec._count.users,
      createdAt: spec.created_at,
      updatedAt: spec.updated_at,
    })),
  };
}
