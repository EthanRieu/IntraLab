import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';
import {
  validateUUID,
  sanitizeString,
  validateArticleStatus,
} from '../../utils/validation';

// Schéma de validation pour la mise à jour d'article
const updateArticleSchema = z
  .object({
    title: z.string().min(5).max(255).optional(),
    content: z.string().min(50).optional(),
    category: z.string().max(100).nullable().optional(),
    linkTo: z.string().url().nullable().optional(),
    status: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête PUT
    assertMethod(event, 'PUT');

    // Récupérer l'ID depuis les paramètres
    const articleId = getRouterParam(event, 'id');

    if (!articleId || !validateUUID(articleId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID d'article invalide",
      });
    }

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const updateData = updateArticleSchema.parse(body);

    // Valider le statut si fourni
    if (updateData.status && !validateArticleStatus(updateData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Statut d'article invalide",
      });
    }

    // Vérifier les permissions et mettre à jour l'article
    const article = await updateArticle(articleId, updateData, user);

    return {
      success: true,
      message: 'Article mis à jour avec succès',
      data: { article },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);

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

// Fonction pour mettre à jour un article
async function updateArticle(
  articleId: string,
  updateData: z.infer<typeof updateArticleSchema>,
  user: any,
) {
  // Récupérer l'article existant avec ses relations
  const existingArticle = await prisma.articles.findUnique({
    where: {
      id: articleId,
      deleted: false,
    },
    include: {
      user_article: {
        include: {
          users_user_article_user_idTousers: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  });

  if (!existingArticle) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article non trouvé',
    });
  }

  // Vérifier les permissions
  const canEdit = checkEditPermissions(existingArticle, user);
  if (!canEdit) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permissions insuffisantes pour modifier cet article',
    });
  }

  // Vérifier si l'article peut être modifié selon son statut
  if (!canModifyArticle(existingArticle, user.roleSlug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cet article ne peut plus être modifié',
    });
  }

  // Préparer les données de mise à jour
  const prismaData: any = {
    updated_at: new Date(),
  };

  if (updateData.title) {
    prismaData.title = sanitizeString(updateData.title);
  }

  if (updateData.content) {
    prismaData.content = sanitizeString(updateData.content);
  }

  if (updateData.category !== undefined) {
    prismaData.category = updateData.category
      ? sanitizeString(updateData.category)
      : null;
  }

  if (updateData.status) {
    prismaData.status = updateData.status;

    // Si l'article passe en statut "pending", mettre à jour la date
    if (
      updateData.status === 'pending' &&
      existingArticle.status !== 'pending'
    ) {
      // Réinitialiser les champs de validation
      await prisma.user_article.updateMany({
        where: { article_id: articleId },
        data: {
          validated_by: null,
          validated_at: null,
        },
      });
    }

    // Si l'article est publié, mettre à jour la date de publication
    if (
      updateData.status === 'published' &&
      existingArticle.status !== 'published'
    ) {
      prismaData.published_at = new Date();
    }
  }

  // Utiliser une transaction pour les mises à jour
  const result = await prisma.$transaction(async (tx) => {
    // Mettre à jour l'article
    const updatedArticle = await tx.articles.update({
      where: { id: articleId },
      data: prismaData,
    });

    // Mettre à jour la relation user_article si nécessaire
    if (updateData.linkTo !== undefined) {
      await tx.user_article.updateMany({
        where: { article_id: articleId },
        data: {
          link_to: updateData.linkTo,
        },
      });
    }

    // Récupérer l'article complet mis à jour
    return await tx.articles.findUnique({
      where: { id: articleId },
      include: {
        user_article: {
          include: {
            users_user_article_user_idTousers: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            users_user_article_validated_byTousers: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });
  });

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la mise à jour de l'article",
    });
  }

  // Formater la réponse
  const userArticle = result.user_article[0];
  return {
    id: result.id,
    title: result.title,
    content: result.content,
    category: result.category,
    status: result.status,
    rejectionReason: result.rejection_reason,
    updatedAt: result.updated_at,
    publishedAt: result.published_at,
    author: userArticle
      ? {
          id: userArticle.users_user_article_user_idTousers.id,
          firstName: userArticle.users_user_article_user_idTousers.first_name,
          lastName: userArticle.users_user_article_user_idTousers.last_name,
        }
      : null,
    validatedBy: userArticle?.users_user_article_validated_byTousers
      ? {
          id: userArticle.users_user_article_validated_byTousers.id,
          firstName:
            userArticle.users_user_article_validated_byTousers.first_name,
          lastName:
            userArticle.users_user_article_validated_byTousers.last_name,
        }
      : null,
    linkTo: userArticle?.link_to,
  };
}

// Fonction pour vérifier les permissions d'édition
function checkEditPermissions(article: any, user: any): boolean {
  // Admin et RP peuvent modifier tous les articles
  if (['admin', 'rp'].includes(user.roleSlug)) {
    return true;
  }

  // L'auteur peut modifier ses propres articles
  const userArticle = article.user_article[0];
  if (userArticle && userArticle.user_id === user.userId) {
    return true;
  }

  return false;
}

// Fonction pour vérifier si un article peut être modifié selon son statut
function canModifyArticle(article: any, userRole: string): boolean {
  // Admin et RP peuvent toujours modifier
  if (['admin', 'rp'].includes(userRole)) {
    return true;
  }

  // Les auteurs ne peuvent pas modifier les articles publiés ou rejetés
  if (['published', 'rejected'].includes(article.status)) {
    return false;
  }

  return true;
}
