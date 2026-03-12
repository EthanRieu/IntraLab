import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const query = getQuery(event);
    const { page, limit } = querySchema.parse(query);
    const skip = (page - 1) * limit;

    const where = {
      active: true,
      deleted: false,
      user_article: {
        some: { user_id: user.userId },
      },
    };

    const [articles, total] = await Promise.all([
      prisma.articles.findMany({
        where,
        include: {
          user_article: {
            include: {
              users_user_article_validated_byTousers: {
                select: { id: true, first_name: true, last_name: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.articles.count({ where }),
    ]);

    const formatted = articles.map((article) => {
      const ua = article.user_article[0];
      return {
        id: article.id,
        title: article.title,
        category: article.category,
        status: article.status,
        rejectionReason: article.rejection_reason,
        createdAt: article.created_at,
        publishedAt: article.published_at,
        images: article.images,
        validatedBy: ua?.users_user_article_validated_byTousers
          ? {
              firstName: ua.users_user_article_validated_byTousers.first_name,
              lastName: ua.users_user_article_validated_byTousers.last_name,
            }
          : null,
        validatedAt: ua?.validated_at ?? null,
      };
    });

    return {
      success: true,
      data: {
        articles: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    handleAuthError(error);
  }
});