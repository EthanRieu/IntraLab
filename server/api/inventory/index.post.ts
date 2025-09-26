import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';
import { sanitizeString } from '../../utils/validation';

// Schéma de validation pour la création d'item d'inventaire
const createItemSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
    description: z.string().optional(),
    category: z
      .string()
      .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
      .optional(),
    quantity: z
      .number()
      .int()
      .min(0, 'La quantité doit être positive ou nulle')
      .default(0),
    quantityAvailable: z
      .number()
      .int()
      .min(0, 'La quantité disponible doit être positive ou nulle')
      .optional(),
    location: z
      .string()
      .max(100, "L'emplacement ne peut pas dépasser 100 caractères")
      .optional(),
  })
  .refine(
    (data) => {
      // La quantité disponible ne peut pas être supérieure à la quantité totale
      if (
        data.quantityAvailable !== undefined &&
        data.quantityAvailable > data.quantity
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'La quantité disponible ne peut pas être supérieure à la quantité totale',
      path: ['quantityAvailable'],
    },
  );

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier les permissions (RP et Admin)
    await requireAdmin(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const itemData = createItemSchema.parse(body);

    // Créer l'item d'inventaire
    const item = await createItem(itemData);

    return {
      success: true,
      message: "Item d'inventaire créé avec succès",
      data: { item },
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'item d'inventaire:", error);

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

// Fonction pour créer un nouvel item d'inventaire
async function createItem(itemData: z.infer<typeof createItemSchema>) {
  // Vérifier qu'un item avec le même nom n'existe pas déjà
  const existingItem = await prisma.inventory.findFirst({
    where: {
      item_name: itemData.name,
      deleted: false,
    },
  });

  if (existingItem) {
    throw createError({
      statusCode: 409,
      statusMessage: "Un item avec ce nom existe déjà dans l'inventaire",
    });
  }

  // Si quantityAvailable n'est pas fournie, elle est égale à quantity
  const quantityAvailable =
    itemData.quantityAvailable !== undefined
      ? itemData.quantityAvailable
      : itemData.quantity;

  // Créer l'item
  const item = await prisma.inventory.create({
    data: {
      item_name: sanitizeString(itemData.name),
      item_description: itemData.description
        ? sanitizeString(itemData.description)
        : null,
      category: itemData.category ? sanitizeString(itemData.category) : null,
      quantity: itemData.quantity,
      quantity_available: quantityAvailable,
      location: itemData.location ? sanitizeString(itemData.location) : null,
      active: true,
    },
  });

  // Formater la réponse
  return {
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
  };
}
