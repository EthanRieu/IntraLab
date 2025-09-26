import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireRP, handleAuthError } from '../../middleware/auth';
import {
  validateEmail,
  validatePhoneNumber,
  sanitizeString,
} from '../../utils/validation';
import { hashPassword } from '../../utils/auth';

// Schéma de validation pour la création d'utilisateur
const createUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(64, 'Le prénom ne peut pas dépasser 64 caractères'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(64, 'Le nom ne peut pas dépasser 64 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  roleId: z.string().uuid('ID de rôle invalide'),
  classId: z.string().uuid('ID de classe invalide').optional(),
  specId: z.string().uuid('ID de spécialisation invalide').optional(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  active: z.boolean().optional().default(true),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier les permissions (RP uniquement - création d'utilisateurs)
    await requireRP(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const userData = createUserSchema.parse(body);

    // Valider les données utilisateur
    await validateUserData(userData);

    // Créer l'utilisateur
    const user = await createUser(userData);

    return {
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          active: user.active,
          createdAt: user.created_at,
        },
      },
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);

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

// Fonction pour valider les données utilisateur
async function validateUserData(userData: z.infer<typeof createUserSchema>) {
  // Validation de l'email
  if (!validateEmail(userData.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Format d'email invalide",
    });
  }

  // Validation du téléphone si fourni
  if (userData.phone && !validatePhoneNumber(userData.phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format de numéro de téléphone invalide',
    });
  }

  // Vérifier que l'email n'existe pas déjà
  const existingUser = await prisma.users.findUnique({
    where: { email: userData.email.toLowerCase() },
  });

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Un utilisateur avec cet email existe déjà',
    });
  }

  // Vérifier que le rôle existe
  const role = await prisma.roles.findUnique({
    where: { id: userData.roleId, active: true, deleted: false },
  });

  if (!role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Rôle invalide',
    });
  }

  // Les RP peuvent créer des comptes admin et student seulement
  if (!['admin', 'student'].includes(role.slug)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Les RP peuvent seulement créer des comptes admin ou student',
    });
  }

  // Vérifier que la classe existe si fournie
  if (userData.classId) {
    const classExists = await prisma.classes.findUnique({
      where: { id: userData.classId, active: true, deleted: false },
    });

    if (!classExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Classe invalide',
      });
    }
  }

  // Vérifier que la spécialisation existe si fournie
  if (userData.specId) {
    const specExists = await prisma.spec.findUnique({
      where: { id: userData.specId, active: true, deleted: false },
    });

    if (!specExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Spécialisation invalide',
      });
    }
  }
}

// Fonction pour créer un nouvel utilisateur
async function createUser(userData: z.infer<typeof createUserSchema>) {
  // Hasher le mot de passe
  const hashedPassword = await hashPassword(userData.password);

  // Nettoyer les données
  const cleanData = {
    first_name: sanitizeString(userData.firstName),
    last_name: sanitizeString(userData.lastName),
    email: userData.email.toLowerCase(),
    phone: userData.phone ? sanitizeString(userData.phone) : null,
    password: hashedPassword,
    role_id: userData.roleId,
    class_id: userData.classId || null,
    spec_id: userData.specId || null,
    active: userData.active,
  };

  return await prisma.users.create({
    data: cleanData,
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
  });
}
