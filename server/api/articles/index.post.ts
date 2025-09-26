import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';
import {
  sanitizeString,
  validateArticleStatus,
} from '../../utils/validation';
import {
  createNotification,
  articleNotifications,
} from '../../utils/notifications';

// Schéma de validation pour la création d'article
const createArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
  content: z
    .string()
    .min(50, 'Le contenu doit contenir au moins 50 caractères'),
  category: z
    .string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional(),
  linkTo: z.string().url('URL invalide').optional(),
  status: z.string().optional().default('draft'),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const articleData = createArticleSchema.parse(body);

    // Valider le statut si fourni
    if (articleData.status && !validateArticleStatus(articleData.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Statut d'article invalide",
      });
    }

    // Créer l'article
    const article = await createArticle(user.userId, articleData);

    return {
      success: true,
      message: 'Article créé avec succès',
      data: { article },
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);

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

// Fonction pour créer un nouvel article
async function createArticle(
  userId: string,
  articleData: z.infer<typeof createArticleSchema>,
) {
  // Utiliser une transaction pour créer l'article et la relation user_article
  const result = await prisma.$transaction(async (tx) => {
    // Créer l'article
    const article = await tx.articles.create({
      data: {
        title: sanitizeString(articleData.title),
        content: sanitizeString(articleData.content),
        category: articleData.category
          ? sanitizeString(articleData.category)
          : null,
        status: articleData.status,
      },
    });

    // Créer la relation user_article
    await tx.user_article.create({
      data: {
        user_id: userId,
        article_id: article.id,
        link_to: articleData.linkTo || null,
      },
    });

    // Récupérer l'article complet avec les relations
    return await tx.articles.findUnique({
      where: { id: article.id },
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
  });

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la création de l'article",
    });
  }

  // Si l'article est soumis pour publication, créer une notification pour les RP/Admin
  if (articleData.status === 'pending') {
    await notifyModerators(result);
  }

  // Formater la réponse
  const userArticle = result.user_article[0];
  return {
    id: result.id,
    title: result.title,
    content: result.content,
    category: result.category,
    status: result.status,
    createdAt: result.created_at,
    author: {
      id: userArticle.users_user_article_user_idTousers.id,
      firstName: userArticle.users_user_article_user_idTousers.first_name,
      lastName: userArticle.users_user_article_user_idTousers.last_name,
      email: userArticle.users_user_article_user_idTousers.email,
    },
    linkTo: userArticle.link_to,
  };
}

// Fonction pour notifier les modérateurs d'un nouvel article en attente
async function notifyModerators(article: any) {
  try {
    // Récupérer tous les RP et Admin
    const moderators = await prisma.users.findMany({
      where: {
        roles: {
          slug: { in: ['admin', 'rp'] },
        },
        active: true,
        deleted: false,
      },
      select: { id: true },
    });

    // Créer des notifications pour tous les modérateurs
    const notifications = moderators.map((moderator) =>
      createNotification({
        userId: moderator.id,
        type: 'article_pending',
        title: 'Nouvel article en attente',
        message: `L'article "${article.title}" est en attente de validation.`,
        relatedId: article.id,
        relatedType: 'article',
      }),
    );

    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Erreur lors de la notification des modérateurs:', error);
    // Ne pas faire échouer la création de l'article pour un problème de notification
  }
}
