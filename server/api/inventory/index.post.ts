import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';
import { sanitizeString } from '../../utils/validation';

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
      .union([z.number(), z.string().transform(Number)])
      .pipe(z.number().int().min(0, 'La quantité doit être positive ou nulle'))
      .default(0),
    quantityAvailable: z
      .union([z.number(), z.string().transform(Number)])
      .pipe(z.number().int().min(0, 'La quantité disponible doit être positive ou nulle'))
      .optional(),
    location: z
      .string()
      .max(100, "L'emplacement ne peut pas dépasser 100 caractères")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.quantityAvailable !== undefined && data.quantityAvailable > data.quantity) {
        return false;
      }
      return true;
    },
    {
      message: 'La quantité disponible ne peut pas être supérieure à la quantité totale',
      path: ['quantityAvailable'],
    },
  );

export default defineEventHandler(async (event) => {
  try {
    assertMethod(event, 'POST');
    await requireAdmin(event);

    const formData = await readMultipartFormData(event);

    let fileData: Buffer | null = null;
    let fileName = '';
    const body: Record<string, string> = {};

    if (formData) {
      for (const item of formData) {
        if (item.name === 'image' && item.filename) {
          fileData = item.data;
          const ext = path.extname(item.filename) || '.png';
          fileName = `${randomUUID()}${ext}`;
        } else if (item.name) {
          body[item.name] = item.data.toString();
        }
      }
    } else {
      // Fallback JSON body
      const jsonBody = await readBody(event);
      Object.assign(body, jsonBody);
    }

    const itemData = createItemSchema.parse(body);

    let imageUrl: string | null = null;
    if (fileData) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'inventory');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, fileName), fileData);
      imageUrl = `/uploads/inventory/${fileName}`;
    }

    const item = await createItem(itemData, imageUrl);

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

async function createItem(itemData: z.infer<typeof createItemSchema>, imageUrl: string | null) {
  const existingItem = await prisma.inventory.findFirst({
    where: { item_name: itemData.name, deleted: false },
  });

  if (existingItem) {
    throw createError({
      statusCode: 409,
      statusMessage: "Un item avec ce nom existe déjà dans l'inventaire",
    });
  }

  const quantityAvailable =
    itemData.quantityAvailable !== undefined ? itemData.quantityAvailable : itemData.quantity;

  const item = await prisma.inventory.create({
    data: {
      item_name: sanitizeString(itemData.name),
      item_description: itemData.description ? sanitizeString(itemData.description) : null,
      category: itemData.category ? sanitizeString(itemData.category) : null,
      quantity: itemData.quantity,
      quantity_available: quantityAvailable,
      location: itemData.location ? sanitizeString(itemData.location) : null,
      image_url: imageUrl,
      active: true,
    },
  });

  return {
    id: item.item_id,
    name: item.item_name,
    description: item.item_description,
    category: item.category,
    quantity: item.quantity,
    quantityAvailable: item.quantity_available,
    location: item.location,
    imageUrl: item.image_url,
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}
