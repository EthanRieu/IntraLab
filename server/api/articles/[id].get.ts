import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // Récupérer l'ID depuis les paramètres
    const articleId = getRouterParam(event, 'id');

    if (!articleId || !validateUUID(articleId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID d'article invalide",
      });
    }

    // L'authentification est optionnelle
    const user = await optionalAuth(event);

    // Récupérer l'article par ID
    const article = await getArticleById(articleId, user);

    return {
      success: true,
      data: { article },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);

    if ((error as any).statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer un article par ID
async function getArticleById(articleId: string, user: any) {
  const article = await prisma.articles.findUnique({
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
              profile_picture_url: true,
              classes: {
                select: {
                  slug: true,
                  name: true,
                  level: true,
                },
              },
              spec: {
                select: {
                  slug: true,
                  name: true,
                },
              },
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

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article non trouvé',
    });
  }

  // Vérifier les permissions d'accès
  const canAccess = checkArticleAccess(article, user);
  if (!canAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé à cet article',
    });
  }

  // Formater les données
  const userArticle = article.user_article[0];
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    status: article.status,
    rejectionReason: article.rejection_reason,
    active: article.active,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    publishedAt: article.published_at,
    author: userArticle
      ? {
        id: userArticle.users_user_article_user_idTousers.id,
        firstName: userArticle.users_user_article_user_idTousers.first_name,
        lastName: userArticle.users_user_article_user_idTousers.last_name,
        email: userArticle.users_user_article_user_idTousers.email,
        avatarUrl: userArticle.users_user_article_user_idTousers.profile_picture_url ?? null,
        class: userArticle.users_user_article_user_idTousers.classes
          ? {
            slug: userArticle.users_user_article_user_idTousers.classes
              .slug,
            name: userArticle.users_user_article_user_idTousers.classes
              .name,
            level:
              userArticle.users_user_article_user_idTousers.classes.level,
          }
          : null,
        specialization: userArticle.users_user_article_user_idTousers.spec
          ? {
            slug: userArticle.users_user_article_user_idTousers.spec.slug,
            name: userArticle.users_user_article_user_idTousers.spec.name,
          }
          : null,
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
    validatedAt: userArticle?.validated_at,
    linkTo: userArticle?.link_to,
    hasImage: !!userArticle?.img,
    images: article.images,
  };
}

// Fonction pour vérifier l'accès à un article
function checkArticleAccess(article: any, user: any): boolean {
  // Article publié et actif : accessible à tous
  if (article.status === 'published' && article.active) {
    return true;
  }

  // Si pas d'utilisateur connecté, seuls les articles publiés sont accessibles
  if (!user) {
    return false;
  }

  // Admin et RP peuvent voir tous les articles
  if (['admin', 'rp'].includes(user.roleSlug)) {
    return true;
  }

  // L'auteur peut voir ses propres articles
  const userArticle = article.user_article[0];
  if (userArticle && userArticle.user_id === user.userId) {
    return true;
  }

  return false;
}
