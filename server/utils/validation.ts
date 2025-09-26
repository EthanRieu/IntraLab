import { z } from 'zod';

// Validation des emails
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation des rôles valides
export const validateUserRole = (roleSlug: string): boolean => {
  const validRoles = ['student', 'admin', 'rp']; // Rôles de base
  return validRoles.includes(roleSlug);
};

// Validation des UUID
export const validateUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Validation des mots de passe
export const validatePassword = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation des statuts d'articles
export const validateArticleStatus = (status: string): boolean => {
  const validStatuses = ['draft', 'pending', 'published', 'rejected'];
  return validStatuses.includes(status);
};

// Validation des statuts d'emprunts
export const validateLoanStatus = (status: string): boolean => {
  const validStatuses = [
    'pending',
    'approved',
    'rejected',
    'returned',
    'overdue',
  ];
  return validStatuses.includes(status);
};

// Validation des statuts du store
export const validateStoreStatus = (status: string): boolean => {
  const validStatuses = ['active', 'sold', 'inactive'];
  return validStatuses.includes(status);
};

// Fonction générique de validation avec Zod
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: boolean; data?: T; errors?: z.ZodError } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Nettoyage et sanitisation des chaînes
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validation des numéros de téléphone français
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
