import { z } from 'zod';
import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  condition: z.string().optional(),
  brand: z.string().optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'date_desc', 'date_asc'])
    .optional()
    .default('date_desc'),
});

export default defineEventHandler(async (event) => {
  try {
    // L'authentification est optionnelle pour voir les annonces
    await optionalAuth(event);

    // Récupérer les annonces actives
    const result = await getActiveListings(event);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres invalides',
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer les annonces actives
async function getActiveListings(event: H3Event) {
  const query = getQuery(event);
  const {
    page,
    limit,
    category,
    search,
    minPrice,
    maxPrice,
    condition,
    brand,
    sortBy,
  } = querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    status: 'active',
    store_item: {
      some: {
        active: true,
        deleted: false,
      },
    },
  };

  // Filtres sur les items du store
  const itemFilters: any = {
    active: true,
    deleted: false,
  };

  if (category) {
    itemFilters.category = category;
  }

  if (search) {
    itemFilters.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined) {
    itemFilters.price = { ...itemFilters.price, gte: minPrice };
  }

  if (maxPrice !== undefined) {
    itemFilters.price = { ...itemFilters.price, lte: maxPrice };
  }

  if (condition) {
    itemFilters.condition = condition;
  }

  if (brand) {
    itemFilters.brand = { contains: brand, mode: 'insensitive' };
  }

  // Mise à jour du filtre principal
  where.store_item = {
    some: itemFilters,
  };

  // Définir l'ordre de tri
  let orderBy: any = { created_at: 'desc' };
  switch (sortBy) {
    case 'price_asc':
      orderBy = { store_item: { _count: 'asc' } }; // Approximation, il faudrait une requête plus complexe
      break;
    case 'price_desc':
      orderBy = { store_item: { _count: 'desc' } };
      break;
    case 'date_asc':
      orderBy = { created_at: 'asc' };
      break;
    case 'date_desc':
    default:
      orderBy = { created_at: 'desc' };
      break;
  }

  // Exécuter les requêtes en parallèle
  const [listings, total, categories] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        users_store_seller_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            classes: {
              select: {
                slug: true,
                name: true,
                level: true,
              },
            },
          },
        },
        store_item: {
          where: itemFilters,
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    // Compter le total avec les mêmes filtres
    prisma.store.count({ where }),
    // Récupérer les catégories disponibles
    prisma.store_item.groupBy({
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
  const formattedListings = listings.map((listing) => {
    const items = listing.store_item;
    const mainItem = items[0]; // Prendre le premier item comme référence

    return {
      id: listing.id,
      seller: {
        id: listing.users_store_seller_idTousers.id,
        firstName: listing.users_store_seller_idTousers.first_name,
        lastName: listing.users_store_seller_idTousers.last_name,
        email: listing.users_store_seller_idTousers.email,
        class: listing.users_store_seller_idTousers.classes
          ? {
              slug: listing.users_store_seller_idTousers.classes.slug,
              name: listing.users_store_seller_idTousers.classes.name,
              level: listing.users_store_seller_idTousers.classes.level,
            }
          : null,
      },
      status: listing.status,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      transactionDate: listing.transaction_date,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        condition: item.condition,
        price: parseFloat(item.price.toString()),
        brand: item.brand,
        images: item.images,
        createdAt: item.created_at,
      })),
      // Informations résumées pour la liste
      mainItem: mainItem
        ? {
            name: mainItem.name,
            price: parseFloat(mainItem.price.toString()),
            category: mainItem.category,
            condition: mainItem.condition,
            images: mainItem.images,
          }
        : null,
      itemCount: items.length,
    };
  });

  return {
    listings: formattedListings,
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
  };
}

// Fonction pour récupérer les annonces par catégorie
export async function getListingsByCategory(category: string) {
  const listings = await prisma.store.findMany({
    where: {
      status: 'active',
      store_item: {
        some: {
          category,
          active: true,
          deleted: false,
        },
      },
    },
    include: {
      users_store_seller_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      store_item: {
        where: {
          category,
          active: true,
          deleted: false,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return listings.map((listing) => ({
    id: listing.id,
    seller: {
      id: listing.users_store_seller_idTousers.id,
      firstName: listing.users_store_seller_idTousers.first_name,
      lastName: listing.users_store_seller_idTousers.last_name,
    },
    items: listing.store_item.map((item) => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.toString()),
      condition: item.condition,
      images: item.images,
    })),
  }));
}
