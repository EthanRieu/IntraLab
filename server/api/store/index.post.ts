import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';
import { sanitizeString, validateStoreStatus } from '../../utils/validation';

// Schéma de validation pour un item du store
const storeItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: z
    .string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair'], {
    errorMap: () => ({
      message: 'L\'état doit être "new", "excellent", "good" ou "fair"',
    }),
  }),
  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(10000, 'Le prix ne peut pas dépasser 10000€'),
  brand: z
    .string()
    .max(255, 'La marque ne peut pas dépasser 255 caractères')
    .optional(),
  images: z
    .array(z.string().url("URL d'image invalide"))
    .max(5, 'Maximum 5 images par item')
    .optional(),
});

// Schéma de validation pour la création d'annonce
const createListingSchema = z.object({
  items: z
    .array(storeItemSchema)
    .min(1, 'Au moins un item doit être fourni')
    .max(10, 'Maximum 10 items par annonce'),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const listingData = createListingSchema.parse(body);

    // Créer l'annonce
    const listing = await createListing(user.userId, listingData);

    return {
      success: true,
      message: 'Annonce créée avec succès',
      data: { listing },
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'annonce:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: error.issues,
      });
    }

    handleAuthError(error);
  }
});

// Fonction pour créer une nouvelle annonce
async function createListing(
  sellerId: string,
  listingData: z.infer<typeof createListingSchema>,
) {
  // Vérifier que l'utilisateur n'a pas trop d'annonces actives (limite de 20)
  const activeListingsCount = await prisma.store.count({
    where: {
      seller_id: sellerId,
      status: 'active',
    },
  });

  if (activeListingsCount >= 20) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vous avez atteint la limite de 20 annonces actives',
    });
  }

  // Utiliser une transaction pour créer l'annonce et tous les items
  const result = await prisma.$transaction(async (tx) => {
    // Créer l'annonce principal
    const store = await tx.store.create({
      data: {
        seller_id: sellerId,
        status: 'active',
      },
    });

    // Créer tous les items associés
    const createdItems = await Promise.all(
      listingData.items.map((itemData) =>
        tx.store_item.create({
          data: {
            store_id: store.id,
            name: sanitizeString(itemData.name),
            description: itemData.description
              ? sanitizeString(itemData.description)
              : null,
            category: itemData.category
              ? sanitizeString(itemData.category)
              : null,
            condition: itemData.condition,
            price: itemData.price,
            brand: itemData.brand ? sanitizeString(itemData.brand) : null,
            images: itemData.images ? JSON.stringify(itemData.images) : null,
            active: true,
          },
        }),
      ),
    );

    // Récupérer l'annonce complète avec les relations
    return await tx.store.findUnique({
      where: { id: store.id },
      include: {
        users_store_seller_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        store_item: true,
      },
    });
  });

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la création de l'annonce",
    });
  }

  // Formater la réponse
  return {
    id: result.id,
    seller: {
      id: result.users_store_seller_idTousers.id,
      firstName: result.users_store_seller_idTousers.first_name,
      lastName: result.users_store_seller_idTousers.last_name,
      email: result.users_store_seller_idTousers.email,
    },
    status: result.status,
    createdAt: result.created_at,
    items: result.store_item.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      condition: item.condition,
      price: parseFloat(item.price.toString()),
      brand: item.brand,
      images: item.images ? JSON.parse(item.images.toString()) : null,
      active: item.active,
      createdAt: item.created_at,
    })),
  };
}
