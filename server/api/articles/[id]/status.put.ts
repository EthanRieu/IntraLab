import { z } from 'zod';
import prisma from '../../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../../middleware/auth';
import { validateUUID, validateArticleStatus } from '../../../utils/validation';
import {
  createNotification,
  articleNotifications,
} from '../../../utils/notifications';

// Schéma de validation pour le changement de statut
const updateStatusSchema = z
  .object({
    status: z.enum(['published', 'rejected'], {
      errorMap: () => ({
        message: 'Le statut doit être "published" ou "rejected"',
      }),
    }),
    rejectionReason: z
      .string()
      .min(10, 'La raison du rejet doit contenir au moins 10 caractères')
      .optional(),
  })
  .refine(
    (data) => {
      // Si le statut est "rejected", une raison est requise
      if (data.status === 'rejected' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Une raison de rejet est requise pour rejeter un article',
      path: ['rejectionReason'],
    },
  );

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

    // Vérifier les permissions (RP et Admin)
    const user = await requireAdmin(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const { status, rejectionReason } = updateStatusSchema.parse(body);

    // Mettre à jour le statut de l'article
    const article = await updateArticleStatus(
      articleId,
      status,
      rejectionReason,
      user.userId,
    );

    return {
      success: true,
      message: `Article ${
        status === 'published' ? 'publié' : 'rejeté'
      } avec succès`,
      data: { article },
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);

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

// Fonction pour mettre à jour le statut d'un article
async function updateArticleStatus(
  articleId: string,
  status: 'published' | 'rejected',
  rejectionReason: string | undefined,
  validatorId: string,
) {
  // Récupérer l'article existant
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
              email: true,
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

  // Vérifier que l'article est en attente de validation
  if (existingArticle.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Seuls les articles en attente peuvent être validés ou rejetés',
    });
  }

  // Utiliser une transaction pour les mises à jour
  const result = await prisma.$transaction(async (tx) => {
    // Mettre à jour l'article
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'published') {
      updateData.published_at = new Date();
      updateData.rejection_reason = null; // Nettoyer une éventuelle raison de rejet précédente
    } else {
      updateData.rejection_reason = rejectionReason;
      updateData.published_at = null;
    }

    const updatedArticle = await tx.articles.update({
      where: { id: articleId },
      data: updateData,
    });

    // Mettre à jour la relation user_article avec les informations de validation
    await tx.user_article.updateMany({
      where: { article_id: articleId },
      data: {
        validated_by: validatorId,
        validated_at: new Date(),
      },
    });

    return updatedArticle;
  });

  // Envoyer une notification à l'auteur
  const userArticle = existingArticle.user_article[0];
  if (userArticle) {
    try {
      const notification =
        status === 'published'
          ? articleNotifications.published(
              userArticle.users_user_article_user_idTousers.first_name,
              existingArticle.title,
            )
          : articleNotifications.rejected(
              userArticle.users_user_article_user_idTousers.first_name,
              existingArticle.title,
              rejectionReason,
            );

      await createNotification({
        userId: userArticle.user_id,
        ...notification,
        relatedId: articleId,
        relatedType: 'article',
      });
    } catch (notificationError) {
      console.error(
        "Erreur lors de l'envoi de la notification:",
        notificationError,
      );
      // Ne pas faire échouer l'opération principale
    }
  }

  // Récupérer l'article complet mis à jour
  const finalArticle = await prisma.articles.findUnique({
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

  if (!finalArticle) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la récupération de l'article mis à jour",
    });
  }

  // Formater la réponse
  const finalUserArticle = finalArticle.user_article[0];
  return {
    id: finalArticle.id,
    title: finalArticle.title,
    status: finalArticle.status,
    rejectionReason: finalArticle.rejection_reason,
    publishedAt: finalArticle.published_at,
    updatedAt: finalArticle.updated_at,
    author: finalUserArticle
      ? {
          id: finalUserArticle.users_user_article_user_idTousers.id,
          firstName:
            finalUserArticle.users_user_article_user_idTousers.first_name,
          lastName:
            finalUserArticle.users_user_article_user_idTousers.last_name,
        }
      : null,
    validatedBy: finalUserArticle?.users_user_article_validated_byTousers
      ? {
          id: finalUserArticle.users_user_article_validated_byTousers.id,
          firstName:
            finalUserArticle.users_user_article_validated_byTousers.first_name,
          lastName:
            finalUserArticle.users_user_article_validated_byTousers.last_name,
        }
      : null,
    validatedAt: finalUserArticle?.validated_at,
  };
}
