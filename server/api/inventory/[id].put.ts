import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';
import { validateUUID, sanitizeString } from '../../utils/validation';

// Schéma de validation pour la mise à jour d'item d'inventaire
const updateItemSchema = z
  .object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    quantity: z.number().int().min(0).optional(),
    quantityAvailable: z.number().int().min(0).optional(),
    location: z.string().max(100).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête PUT
    assertMethod(event, 'PUT');

    // Récupérer l'ID depuis les paramètres
    const itemId = getRouterParam(event, 'id');

    if (!itemId || !validateUUID(itemId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID d'item invalide",
      });
    }

    // Vérifier les permissions (RP et Admin)
    await requireAdmin(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const updateData = updateItemSchema.parse(body);

    // Mettre à jour l'item
    const item = await updateItem(itemId, updateData);

    return {
      success: true,
      message: "Item d'inventaire mis à jour avec succès",
      data: { item },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'item:", error);

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

// Fonction pour mettre à jour un item d'inventaire
async function updateItem(
  itemId: string,
  updateData: z.infer<typeof updateItemSchema>,
) {
  // Récupérer l'item existant
  const existingItem = await prisma.inventory.findUnique({
    where: {
      item_id: itemId,
      deleted: false,
    },
    include: {
      loan: {
        where: {
          status: { in: ['pending', 'approved'] },
          deleted: false,
        },
      },
    },
  });

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item non trouvé',
    });
  }

  // Vérifications spécifiques pour les quantités
  if (
    updateData.quantity !== undefined ||
    updateData.quantityAvailable !== undefined
  ) {
    const newQuantity =
      updateData.quantity !== undefined
        ? updateData.quantity
        : existingItem.quantity;
    const newQuantityAvailable =
      updateData.quantityAvailable !== undefined
        ? updateData.quantityAvailable
        : existingItem.quantity_available;

    // Vérifier que la quantité disponible n'est pas supérieure à la quantité totale
    if (newQuantityAvailable > newQuantity) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'La quantité disponible ne peut pas être supérieure à la quantité totale',
      });
    }

    // Calculer la quantité actuellement empruntée
    const quantityOnLoan =
      existingItem.quantity - existingItem.quantity_available;

    // Vérifier qu'on ne réduit pas la quantité totale en dessous de ce qui est emprunté
    if (newQuantity < quantityOnLoan) {
      throw createError({
        statusCode: 400,
        statusMessage: `Impossible de réduire la quantité à ${newQuantity}. ${quantityOnLoan} unités sont actuellement empruntées.`,
      });
    }

    // Si on met à jour seulement la quantité totale, ajuster automatiquement la quantité disponible
    if (
      updateData.quantity !== undefined &&
      updateData.quantityAvailable === undefined
    ) {
      updateData.quantityAvailable = newQuantity - quantityOnLoan;
    }
  }

  // Vérifier que le nom n'est pas déjà utilisé par un autre item
  if (updateData.name) {
    const existingWithSameName = await prisma.inventory.findFirst({
      where: {
        item_name: updateData.name,
        item_id: { not: itemId },
        deleted: false,
      },
    });

    if (existingWithSameName) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Un autre item avec ce nom existe déjà',
      });
    }
  }

  // Préparer les données pour Prisma
  const prismaData: any = {
    updated_at: new Date(),
  };

  if (updateData.name) {
    prismaData.item_name = sanitizeString(updateData.name);
  }

  if (updateData.description !== undefined) {
    prismaData.item_description = updateData.description
      ? sanitizeString(updateData.description)
      : null;
  }

  if (updateData.category !== undefined) {
    prismaData.category = updateData.category
      ? sanitizeString(updateData.category)
      : null;
  }

  if (updateData.quantity !== undefined) {
    prismaData.quantity = updateData.quantity;
  }

  if (updateData.quantityAvailable !== undefined) {
    prismaData.quantity_available = updateData.quantityAvailable;
  }

  if (updateData.location !== undefined) {
    prismaData.location = updateData.location
      ? sanitizeString(updateData.location)
      : null;
  }

  if (updateData.active !== undefined) {
    prismaData.active = updateData.active;
  }

  // Exécuter la mise à jour
  const updatedItem = await prisma.inventory.update({
    where: { item_id: itemId },
    data: prismaData,
  });

  // Formater la réponse
  return {
    id: updatedItem.item_id,
    name: updatedItem.item_name,
    description: updatedItem.item_description,
    category: updatedItem.category,
    quantity: updatedItem.quantity,
    quantityAvailable: updatedItem.quantity_available,
    location: updatedItem.location,
    active: updatedItem.active,
    updatedAt: updatedItem.updated_at,
  };
}

// Fonction utilitaire pour mettre à jour les quantités
export async function updateQuantity(
  itemId: string,
  quantityChange: number,
  type: 'borrow' | 'return',
) {
  return await prisma.$transaction(async (tx: any) => {
    const item = await tx.inventory.findUnique({
      where: { item_id: itemId },
    });

    if (!item) {
      throw new Error('Item non trouvé');
    }

    let newQuantityAvailable = item.quantity_available;

    if (type === 'borrow') {
      newQuantityAvailable -= quantityChange;
    } else {
      newQuantityAvailable += quantityChange;
    }

    // Vérifications de sécurité
    if (newQuantityAvailable < 0) {
      throw new Error('Quantité disponible insuffisante');
    }

    if (newQuantityAvailable > item.quantity) {
      throw new Error(
        'La quantité disponible ne peut pas dépasser la quantité totale',
      );
    }

    return await tx.inventory.update({
      where: { item_id: itemId },
      data: {
        quantity_available: newQuantityAvailable,
        updated_at: new Date(),
      },
    });
  });
}
