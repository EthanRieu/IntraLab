import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  try {
    // L'authentification est optionnelle pour cette route publique
    await optionalAuth(event);

    // Récupérer toutes les classes
    const classes = await getAllClasses();

    return {
      success: true,
      data: { classes },
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer toutes les classes
async function getAllClasses() {
  const classes = await prisma.classes.findMany({
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
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  return classes.map((cls) => ({
    id: cls.id,
    slug: cls.slug,
    name: cls.name,
    level: cls.level,
    hasSpecialization: cls.has_specialization,
    studentCount: cls._count.users,
    createdAt: cls.created_at,
    updatedAt: cls.updated_at,
  }));
}
