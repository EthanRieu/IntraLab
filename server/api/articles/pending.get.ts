import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  category: z.string().optional(),
  search: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier les permissions (RP et Admin)
    await requireAdmin(event);

    // Récupérer les articles en attente de validation
    const result = await getPendingArticles(event);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des articles en attente:',
      error,
    );

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres invalides',
        data: error.issues,
      });
    }

    handleAuthError(error);
  }
});

// Fonction pour récupérer les articles en attente de validation
async function getPendingArticles(event: H3Event) {
  const query = getQuery(event);
  const { page, limit, category, search } = querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    status: 'pending',
    active: true,
    deleted: false,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Exécuter les requêtes en parallèle
  const [articles, total] = await Promise.all([
    prisma.articles.findMany({
      where,
      include: {
        user_article: {
          include: {
            users_user_article_user_idTousers: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
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
          },
        },
      },
      orderBy: {
        created_at: 'asc', // Les plus anciens en premier pour la file d'attente
      },
      skip,
      take: limit,
    }),
    prisma.articles.count({ where }),
  ]);

  // Formater les données
  const formattedArticles = articles.map((article) => {
    const userArticle = article.user_article[0];

    return {
      id: article.id,
      title: article.title,
      content:
        article.content.substring(0, 200) +
        (article.content.length > 200 ? '...' : ''), // Aperçu du contenu
      category: article.category,
      status: article.status,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      author: userArticle
        ? {
            id: userArticle.users_user_article_user_idTousers.id,
            firstName: userArticle.users_user_article_user_idTousers.first_name,
            lastName: userArticle.users_user_article_user_idTousers.last_name,
            email: userArticle.users_user_article_user_idTousers.email,
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
      linkTo: userArticle?.link_to,
      hasImage: !!userArticle?.img,
      waitingDays: Math.floor(
        (Date.now() - new Date(article.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    };
  });

  return {
    articles: formattedArticles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    stats: {
      totalPending: total,
      oldestWaitingDays:
        formattedArticles.length > 0
          ? Math.max(...formattedArticles.map((a) => a.waitingDays))
          : 0,
    },
  };
}
