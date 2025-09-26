import { z } from 'zod';
import prisma from '../../utils/prisma';
import {
  generateToken,
  verifyPassword,
  AuthError,
  AUTH_ERRORS,
} from '../../utils/auth';
import { validateEmail } from '../../utils/validation';

// Schéma de validation pour la connexion
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Récupérer et valider les données
    const body = await readBody(event);
    const { email, password } = loginSchema.parse(body);

    // Validation supplémentaire de l'email
    if (!validateEmail(email)) {
      throw new AuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 400);
    }

    // Authentifier l'utilisateur
    const user = await authenticateUser(email, password);

    // Générer le token JWT
    const token = generateToken(user);

    // Retourner la réponse de succès
    return {
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
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
        },
      },
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);

    if (error instanceof AuthError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      });
    }

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

// Fonction pour authentifier un utilisateur
async function authenticateUser(email: string, password: string) {
  // Rechercher l'utilisateur avec ses relations
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      roles: true,
      classes: true,
      spec: true,
    },
  });

  // Vérifier que l'utilisateur existe
  if (!user) {
    throw new AuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
  }

  // Vérifier que le compte est actif
  if (!user.active || user.deleted) {
    throw new AuthError(AUTH_ERRORS.USER_INACTIVE, 401);
  }

  // Vérifier que l'utilisateur a un mot de passe défini
  if (!user.password) {
    throw new AuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
  }

  // Vérifier le mot de passe
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
  }

  return user;
}
