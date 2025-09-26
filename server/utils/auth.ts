import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { users, roles } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  roleSlug: string;
  classId?: string;
  specId?: string;
  iat?: number;
  exp?: number;
}

export interface UserWithRole extends users {
  roles: roles;
}

// Générer un token JWT
export const generateToken = (user: UserWithRole): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    roleSlug: user.roles.slug,
    classId: user.class_id || undefined,
    specId: user.spec_id || undefined,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Vérifier et décoder un token JWT
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
};

// Hasher un mot de passe
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Vérifier un mot de passe
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Extraire le token du header Authorization
export const extractTokenFromHeader = (
  authHeader: string | undefined,
): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Enlever "Bearer "
};

// Hiérarchie des rôles : RP > Admin > Student
const ROLE_HIERARCHY = {
  rp: 3,
  admin: 2,
  student: 1,
} as const;

// Vérifier les permissions basées sur le rôle avec hiérarchie
export const checkPermission = (
  userRole: string,
  requiredRoles: string[],
): boolean => {
  const userLevel =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevels = requiredRoles.map(
    (role) => ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0,
  );

  // L'utilisateur doit avoir au moins le niveau requis le plus bas
  return userLevel >= Math.min(...requiredLevels);
};

// Vérifier si l'utilisateur a un niveau de permission supérieur ou égal
export const hasPermissionLevel = (
  userRole: string,
  requiredRole: string,
): boolean => {
  const userLevel =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel =
    ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= requiredLevel;
};

// Vérifier si l'utilisateur est admin
export const isAdmin = (userRole: string): boolean => {
  return userRole === 'admin';
};

// Vérifier si l'utilisateur est RP (Responsable Pédagogique)
export const isRP = (userRole: string): boolean => {
  return userRole === 'rp';
};

// Vérifier si l'utilisateur est étudiant
export const isStudent = (userRole: string): boolean => {
  return userRole === 'student';
};

// Vérifier si l'utilisateur a les droits d'administration (RP ou Admin)
// RP a le niveau le plus élevé, puis Admin
export const hasAdminRights = (userRole: string): boolean => {
  return isRP(userRole) || isAdmin(userRole);
};

// Vérifier si l'utilisateur a les droits de super-admin (RP uniquement)
export const hasSuperAdminRights = (userRole: string): boolean => {
  return isRP(userRole);
};

// Générer un token de réinitialisation de mot de passe (plus court)
export const generateResetToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Interface pour les erreurs d'authentification
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

// Constantes pour les messages d'erreur
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Identifiants invalides',
  TOKEN_EXPIRED: 'Token expiré',
  TOKEN_INVALID: 'Token invalide',
  ACCESS_DENIED: 'Accès refusé',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  USER_INACTIVE: 'Compte utilisateur inactif',
  INSUFFICIENT_PERMISSIONS: 'Permissions insuffisantes',
} as const;
