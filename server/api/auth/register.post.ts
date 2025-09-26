import { z } from 'zod';
import prisma from '../../utils/prisma';
import { generateToken, hashPassword } from '../../utils/auth';
import {
  validateEmail,
  validatePhoneNumber,
  sanitizeString,
} from '../../utils/validation';

// Schéma de validation pour l'inscription
const registerSchema = z.object({
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
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  classId: z.string().uuid('ID de classe invalide'),
  specId: z.string().uuid('ID de spécialisation invalide').optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Récupérer et valider les données
    const body = await readBody(event);
    const userData = registerSchema.parse(body);

    // Valider les données utilisateur
    await validateRegistrationData(userData);

    // Créer le compte étudiant
    const { user, token } = await createStudentAccount(userData);

    return {
      success: true,
      message: 'Compte créé avec succès',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: {
            slug: (user as any).roles.slug,
            name: (user as any).roles.name,
          },
          class: (user as any).classes
            ? {
                slug: (user as any).classes.slug,
                name: (user as any).classes.name,
              }
            : null,
          specialization: (user as any).spec
            ? {
                slug: (user as any).spec.slug,
                name: (user as any).spec.name,
              }
            : null,
        },
      },
    };
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour valider les données d'inscription
async function validateRegistrationData(
  userData: z.infer<typeof registerSchema>,
) {
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

  // Vérifier que la classe existe
  const classExists = await prisma.classes.findUnique({
    where: { id: userData.classId, active: true, deleted: false },
  });

  if (!classExists) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Classe invalide',
    });
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

// Fonction pour créer un compte étudiant
async function createStudentAccount(userData: z.infer<typeof registerSchema>) {
  // Récupérer le rôle étudiant
  const studentRole = await prisma.roles.findUnique({
    where: { slug: 'student', active: true, deleted: false },
  });

  if (!studentRole) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Rôle étudiant non trouvé dans le système',
    });
  }

  // Hasher le mot de passe
  const hashedPassword = await hashPassword(userData.password);

  // Créer l'utilisateur
  const user = await prisma.users.create({
    data: {
      first_name: sanitizeString(userData.firstName),
      last_name: sanitizeString(userData.lastName),
      email: userData.email.toLowerCase(),
      phone: userData.phone ? sanitizeString(userData.phone) : null,
      password: hashedPassword,
      role_id: studentRole.id,
      class_id: userData.classId,
      spec_id: userData.specId || null,
      active: true, // Le compte est actif dès la création
    },
    include: {
      roles: {
        select: { slug: true, name: true },
      },
      classes: {
        select: { slug: true, name: true, level: true },
      },
      spec: {
        select: { slug: true, name: true },
      },
    },
  });

  // Générer le token JWT
  const token = generateToken(user as any);

  return { user, token };
}
