import { z } from 'zod';
import prisma from '../../../utils/prisma';
import { requireRP, handleAuthError } from '../../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  role: z.string().optional(),
  class: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier les permissions (RP ou Admin uniquement)
    await requireRP(event);

    // Récupérer les utilisateurs en attente de validation
    const result = await getPendingUsers(event);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des utilisateurs en attente:',
      error,
    );

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres invalides',
        data: error.issues,
      });
    }

    handleAuthError(error);
  }
});

// Fonction pour récupérer les utilisateurs en attente de validation
async function getPendingUsers(event: H3Event) {
  const query = getQuery(event);
  const { page, limit, role, class: classSlug } = querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres pour les utilisateurs inactifs (en attente)
  const where: any = {
    active: false,
    deleted: false,
  };

  if (role) {
    where.roles = { slug: role };
  }

  if (classSlug) {
    where.classes = { slug: classSlug };
  }

  // Exécuter les requêtes en parallèle
  const [users, total, roleStats, classStats] = await Promise.all([
    prisma.users.findMany({
      where,
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
      },
      orderBy: {
        created_at: 'asc', // Les plus anciens en premier
      },
      skip,
      take: limit,
    }),
    prisma.users.count({ where }),
    // Statistiques par rôle
    prisma.users.groupBy({
      by: ['role_id'],
      where: { ...where },
      _count: { id: true },
    }),
    // Statistiques par classe
    prisma.users.groupBy({
      by: ['class_id'],
      where: { ...where, class_id: { not: null } },
      _count: { id: true },
    }),
  ]);

  // Formater les données
  const formattedUsers = users.map((user) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
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
    waitingDays: Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  }));

  // Enrichir les statistiques avec les noms des rôles et classes
  const enrichedRoleStats = await Promise.all(
    roleStats.map(async (stat) => {
      const role = await prisma.roles.findUnique({
        where: { id: stat.role_id },
        select: { slug: true, name: true },
      });
      return {
        roleId: stat.role_id,
        slug: role?.slug,
        name: role?.name,
        count: stat._count.id,
      };
    }),
  );

  const enrichedClassStats = await Promise.all(
    classStats.map(async (stat) => {
      const classInfo = await prisma.classes.findUnique({
        where: { id: stat.class_id! },
        select: { slug: true, name: true, level: true },
      });
      return {
        classId: stat.class_id,
        slug: classInfo?.slug,
        name: classInfo?.name,
        level: classInfo?.level,
        count: stat._count.id,
      };
    }),
  );

  return {
    users: formattedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    stats: {
      totalPending: total,
      oldestWaitingDays:
        formattedUsers.length > 0
          ? Math.max(...formattedUsers.map((u) => u.waitingDays))
          : 0,
      byRole: enrichedRoleStats,
      byClass: enrichedClassStats,
    },
  };
}
