import type { H3Event } from 'h3';
import {
  verifyToken,
  extractTokenFromHeader,
  AuthError,
  AUTH_ERRORS,
  type JWTPayload,
} from '../utils/auth';
import prisma from '../utils/prisma';

// Interface pour l'utilisateur authentifié avec ses relations
export interface AuthenticatedUser extends JWTPayload {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    roles: {
      slug: string;
      name: string;
    };
    classes?: {
      slug: string;
      name: string;
    } | null;
    spec?: {
      slug: string;
      name: string;
    } | null;
  };
}

// Middleware de base pour l'authentification
export const requireAuth = async (
  event: H3Event,
): Promise<AuthenticatedUser> => {
  const authHeader = getHeader(event, 'authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new AuthError(AUTH_ERRORS.TOKEN_INVALID, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new AuthError(AUTH_ERRORS.TOKEN_INVALID, 401);
  }

  // Vérifier que l'utilisateur existe toujours et est actif
  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    include: {
      roles: true,
      classes: true,
      spec: true,
    },
  });

  if (!user || !user.active || user.deleted) {
    throw new AuthError(AUTH_ERRORS.USER_INACTIVE, 401);
  }

  const authenticatedUser: AuthenticatedUser = {
    ...payload,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      active: user.active,
      roles: {
        slug: user.roles.slug,
        name: user.roles.name,
      },
      classes: user.classes
        ? {
            slug: user.classes.slug,
            name: user.classes.name,
          }
        : null,
      spec: user.spec
        ? {
            slug: user.spec.slug,
            name: user.spec.name,
          }
        : null,
    },
  };

  // Ajouter l'utilisateur au contexte de l'événement
  event.context.user = authenticatedUser;

  return authenticatedUser;
};

// Middleware pour vérifier les rôles spécifiques
export const requireRole = (allowedRoles: string[]) => {
  return async (event: H3Event): Promise<AuthenticatedUser> => {
    const user = await requireAuth(event);

    if (!allowedRoles.includes(user.roleSlug)) {
      throw new AuthError(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, 403);
    }

    return user;
  };
};

// Middleware pour les RP uniquement (niveau le plus élevé)
export const requireRP = async (event: H3Event): Promise<AuthenticatedUser> => {
  return requireRole(['rp'])(event);
};

// Middleware pour les administrateurs et RP (RP > Admin)
export const requireAdmin = async (
  event: H3Event,
): Promise<AuthenticatedUser> => {
  return requireRole(['rp', 'admin'])(event);
};

// Middleware pour tous les rôles avec droits d'administration (RP et Admin)
export const requireAdminRights = async (
  event: H3Event,
): Promise<AuthenticatedUser> => {
  return requireRole(['rp', 'admin'])(event);
};

// Middleware pour vérifier que l'utilisateur peut accéder à ses propres données ou a des droits d'admin
export const requireOwnershipOrAdmin = (
  getUserId: (event: H3Event) => string,
) => {
  return async (event: H3Event): Promise<AuthenticatedUser> => {
    const user = await requireAuth(event);
    const targetUserId = getUserId(event);

    // RP et Admin peuvent accéder aux données de tous les utilisateurs (RP > Admin)
    if (['rp', 'admin'].includes(user.roleSlug)) {
      return user;
    }

    // Les utilisateurs ne peuvent accéder qu'à leurs propres données
    if (user.userId !== targetUserId) {
      throw new AuthError(AUTH_ERRORS.ACCESS_DENIED, 403);
    }

    return user;
  };
};

// Fonction utilitaire pour gérer les erreurs d'authentification dans les handlers
export const handleAuthError = (error: unknown) => {
  if (error instanceof AuthError) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
    });
  }

  // Erreur générique
  throw createError({
    statusCode: 500,
    statusMessage: 'Erreur interne du serveur',
  });
};

// Fonction utilitaire pour obtenir l'utilisateur authentifié depuis le contexte
export const getAuthenticatedUser = (event: H3Event): AuthenticatedUser => {
  const user = event.context.user as AuthenticatedUser;
  if (!user) {
    throw new AuthError(AUTH_ERRORS.TOKEN_INVALID, 401);
  }
  return user;
};

// Middleware optionnel - n'échoue pas si pas de token
export const optionalAuth = async (
  event: H3Event,
): Promise<AuthenticatedUser | null> => {
  try {
    return await requireAuth(event);
  } catch (error) {
    return null;
  }
};

// Export par défaut pour Nitro
export default defineEventHandler(async (event) => {
  // Ce middleware peut être utilisé globalement si nécessaire
  // Pour l'instant, il ne fait rien et laisse passer toutes les requêtes
  // Les endpoints spécifiques utilisent les middlewares nommés ci-dessus
});
