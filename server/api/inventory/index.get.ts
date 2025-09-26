import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  search: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  available: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined,
    ),
  minQuantity: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    await requireAuth(event);

    // Récupérer tous les items avec filtres
    const result = await getAllItems(event);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'inventaire:", error);

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

// Fonction pour récupérer tous les items d'inventaire
async function getAllItems(event: H3Event) {
  const query = getQuery(event);
  const { page, limit, search, category, location, available, minQuantity } =
    querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    active: true,
    deleted: false,
  };

  if (search) {
    where.OR = [
      { item_name: { contains: search, mode: 'insensitive' } },
      { item_description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  if (available === true) {
    where.quantity_available = { gt: 0 };
  } else if (available === false) {
    where.quantity_available = 0;
  }

  if (minQuantity !== undefined) {
    where.quantity = { gte: minQuantity };
  }

  // Exécuter les requêtes en parallèle
  const [items, total, categories] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        _count: {
          select: {
            loan: {
              where: {
                status: { in: ['pending', 'approved'] },
                deleted: false,
              },
            },
          },
        },
      },
      orderBy: [{ item_name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.inventory.count({ where }),
    // Récupérer les catégories disponibles
    prisma.inventory.groupBy({
      by: ['category'],
      where: {
        active: true,
        deleted: false,
        category: { not: null },
      },
      _count: { category: true },
    }),
  ]);

  // Formater les données
  const formattedItems = items.map((item) => ({
    id: item.item_id,
    name: item.item_name,
    description: item.item_description,
    category: item.category,
    quantity: item.quantity,
    quantityAvailable: item.quantity_available,
    location: item.location,
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    stats: {
      activeLoans: item._count.loan,
      utilizationRate:
        item.quantity > 0
          ? Math.round(
              ((item.quantity - item.quantity_available) / item.quantity) * 100,
            )
          : 0,
    },
  }));

  return {
    items: formattedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    filters: {
      categories: categories.map((cat) => ({
        name: cat.category,
        count: cat._count.category,
      })),
    },
    stats: {
      totalItems: total,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAvailable: items.reduce(
        (sum, item) => sum + item.quantity_available,
        0,
      ),
    },
  };
}

// Fonction pour récupérer les items disponibles à l'emprunt
export async function getAvailableItems() {
  const items = await prisma.inventory.findMany({
    where: {
      active: true,
      deleted: false,
      quantity_available: { gt: 0 },
    },
    orderBy: [{ category: 'asc' }, { item_name: 'asc' }],
  });

  return items.map((item) => ({
    id: item.item_id,
    name: item.item_name,
    description: item.item_description,
    category: item.category,
    quantityAvailable: item.quantity_available,
    location: item.location,
  }));
}
