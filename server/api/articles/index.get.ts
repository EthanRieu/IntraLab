import { z } from 'zod';
import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  author: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // L'authentification est optionnelle
    const user = await optionalAuth(event);

    // Récupérer les articles avec filtres
    const result = await getPublishedArticles(event, user);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres invalides',
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
    });
  }
});

// Fonction pour récupérer les articles publiés avec filtres
async function getPublishedArticles(event: H3Event, user: any) {
  const query = getQuery(event);
  const { page, limit, status, category, search, author } =
    querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    active: true,
    deleted: false,
  };

  // Si pas d'utilisateur connecté ou utilisateur normal, montrer seulement les articles publiés
  if (!user || user.roleSlug === 'student') {
    where.status = 'published';
  } else if (status) {
    // Admin/RP peuvent filtrer par statut
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (author) {
    where.user_article = {
      some: {
        users_user_article_user_idTousers: {
          OR: [
            { first_name: { contains: author, mode: 'insensitive' } },
            { last_name: { contains: author, mode: 'insensitive' } },
          ],
        },
      },
    };
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
      orderBy: [{ published_at: 'desc' }, { created_at: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.articles.count({ where }),
  ]);

  // Formater les données
  const formattedArticles = articles.map((article: any) => {
    const userArticle = article.user_article[0]; // Supposons qu'il n'y a qu'un auteur par article

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      status: article.status,
      rejectionReason: article.rejection_reason,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      publishedAt: article.published_at,
      author: userArticle
        ? {
          id: userArticle.users_user_article_user_idTousers.id,
          firstName: userArticle.users_user_article_user_idTousers.first_name,
          lastName: userArticle.users_user_article_user_idTousers.last_name,
          email: userArticle.users_user_article_user_idTousers.email,
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
  };
}
