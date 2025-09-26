import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  search: z.string().optional(),
  role: z.string().optional(),
  class: z.string().optional(),
  spec: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined,
    ),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier les permissions (RP et Admin)
    await requireAdmin(event);

    // Récupérer tous les utilisateurs avec filtres
    const users = await getAllUsers(event);

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    handleAuthError(error);
  }
});

// Fonction pour récupérer tous les utilisateurs avec filtres
async function getAllUsers(event: H3Event) {
  const query = getQuery(event);
  const {
    page,
    limit,
    search,
    role,
    class: classSlug,
    spec: specSlug,
    active,
  } = querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    deleted: false,
  };

  if (active !== undefined) {
    where.active = active;
  }

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: 'insensitive' } },
      { last_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.roles = { slug: role };
  }

  if (classSlug) {
    where.classes = { slug: classSlug };
  }

  if (specSlug) {
    where.spec = { slug: specSlug };
  }

  // Exécuter les requêtes en parallèle
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      include: {
        roles: {
          select: { slug: true, name: true },
        },
        classes: {
          select: { slug: true, name: true },
        },
        spec: {
          select: { slug: true, name: true },
        },
      },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.users.count({ where }),
  ]);

  // Formater les données
  const formattedUsers = users.map((user) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    active: user.active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    role: {
      slug: user.roles.slug,
      name: user.roles.name,
    },
    class: user.classes
      ? {
          slug: user.classes.slug,
          name: user.classes.name,
        }
      : null,
    specialization: user.spec
      ? {
          slug: user.spec.slug,
          name: user.spec.name,
        }
      : null,
  }));

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
  };
}
