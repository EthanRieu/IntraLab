import { z } from 'zod';
import prisma from '../../utils/prisma';
import {
  requireOwnershipOrAdmin,
  handleAuthError,
} from '../../middleware/auth';
import {
  validateUUID,
  validateEmail,
  validatePhoneNumber,
  sanitizeString,
} from '../../utils/validation';

// Schéma de validation pour la mise à jour d'utilisateur
const updateUserSchema = z
  .object({
    firstName: z.string().min(2).max(64).optional(),
    lastName: z.string().min(2).max(64).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    roleId: z.string().uuid().optional(),
    classId: z.string().uuid().nullable().optional(),
    specId: z.string().uuid().nullable().optional(),
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
    const userId = getRouterParam(event, 'id');

    if (!userId || !validateUUID(userId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID utilisateur invalide',
      });
    }

    // Vérifier les permissions (propriétaire, RP ou Admin)
    const currentUser = await requireOwnershipOrAdmin(() => userId)(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const updateData = updateUserSchema.parse(body);

    // Valider les données spécifiques
    await validateUpdateData(updateData, userId, currentUser.roleSlug);

    // Mettre à jour l'utilisateur
    const updatedUser = await updateUser(userId, updateData);

    return {
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);

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

// Fonction pour valider les données de mise à jour
async function validateUpdateData(
  updateData: z.infer<typeof updateUserSchema>,
  userId: string,
  currentUserRole: string,
) {
  // Validation de l'email si fourni
  if (updateData.email) {
    if (!validateEmail(updateData.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Format d'email invalide",
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    const existingUser = await prisma.users.findFirst({
      where: {
        email: updateData.email.toLowerCase(),
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Un utilisateur avec cet email existe déjà',
      });
    }
  }

  // Validation du téléphone si fourni
  if (updateData.phone && !validatePhoneNumber(updateData.phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format de numéro de téléphone invalide',
    });
  }

  // Gestion des permissions par champ
  const adminOnlyFields = ['active'];
  const rpOnlyFields = ['roleId'];

  const hasAdminFields = adminOnlyFields.some((field) => field in updateData);
  const hasRpFields = rpOnlyFields.some((field) => field in updateData);

  // Seuls RP et Admin peuvent modifier le champ 'active'
  if (hasAdminFields && !['admin', 'rp'].includes(currentUserRole)) {
    throw createError({
      statusCode: 403,
      statusMessage:
        'Permissions insuffisantes pour modifier le statut utilisateur',
    });
  }

  // Seuls les RP peuvent modifier les rôles
  if (hasRpFields && currentUserRole !== 'rp') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les RP peuvent modifier les rôles des utilisateurs',
    });
  }

  // Vérifier que le rôle existe si fourni
  if (updateData.roleId) {
    const role = await prisma.roles.findUnique({
      where: { id: updateData.roleId, active: true, deleted: false },
    });

    if (!role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Rôle invalide',
      });
    }

    // Les RP peuvent seulement transformer entre admin et student
    if (currentUserRole === 'rp' && !['admin', 'student'].includes(role.slug)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Les RP peuvent seulement assigner les rôles admin ou student',
      });
    }
  }

  // Vérifier que la classe existe si fournie
  if (updateData.classId) {
    const classExists = await prisma.classes.findUnique({
      where: { id: updateData.classId, active: true, deleted: false },
    });

    if (!classExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Classe invalide',
      });
    }
  }

  // Vérifier que la spécialisation existe si fournie
  if (updateData.specId) {
    const specExists = await prisma.spec.findUnique({
      where: { id: updateData.specId, active: true, deleted: false },
    });

    if (!specExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Spécialisation invalide',
      });
    }
  }
}

// Fonction pour mettre à jour un utilisateur
async function updateUser(
  userId: string,
  updateData: z.infer<typeof updateUserSchema>,
) {
  // Préparer les données pour Prisma
  const prismaData: any = {
    updated_at: new Date(),
  };

  if (updateData.firstName) {
    prismaData.first_name = sanitizeString(updateData.firstName);
  }

  if (updateData.lastName) {
    prismaData.last_name = sanitizeString(updateData.lastName);
  }

  if (updateData.email) {
    prismaData.email = updateData.email.toLowerCase();
  }

  if (updateData.phone !== undefined) {
    prismaData.phone = updateData.phone
      ? sanitizeString(updateData.phone)
      : null;
  }

  if (updateData.roleId) {
    prismaData.role_id = updateData.roleId;
  }

  if (updateData.classId !== undefined) {
    prismaData.class_id = updateData.classId;
  }

  if (updateData.specId !== undefined) {
    prismaData.spec_id = updateData.specId;
  }

  if (updateData.active !== undefined) {
    prismaData.active = updateData.active;
  }

  // Exécuter la mise à jour
  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: prismaData,
    include: {
      roles: {
        select: { id: true, slug: true, name: true },
      },
      classes: {
        select: { id: true, slug: true, name: true, level: true },
      },
      spec: {
        select: { id: true, slug: true, name: true },
      },
    },
  });

  // Formater la réponse
  return {
    id: updatedUser.id,
    firstName: updatedUser.first_name,
    lastName: updatedUser.last_name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    active: updatedUser.active,
    updatedAt: updatedUser.updated_at,
    role: {
      id: updatedUser.roles.id,
      slug: updatedUser.roles.slug,
      name: updatedUser.roles.name,
    },
    class: updatedUser.classes
      ? {
          id: updatedUser.classes.id,
          slug: updatedUser.classes.slug,
          name: updatedUser.classes.name,
          level: updatedUser.classes.level,
        }
      : null,
    specialization: updatedUser.spec
      ? {
          id: updatedUser.spec.id,
          slug: updatedUser.spec.slug,
          name: updatedUser.spec.name,
        }
      : null,
  };
}
