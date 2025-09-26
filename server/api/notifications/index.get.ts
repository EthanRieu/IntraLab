import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  type: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer les notifications de l'utilisateur
    const result = await getUserNotifications(event, user.userId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);

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

// Fonction pour récupérer les notifications d'un utilisateur
async function getUserNotifications(event: H3Event, userId: string) {
  const query = getQuery(event);
  const { page, limit, unreadOnly, type } = querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    user_id: userId,
  };

  if (unreadOnly) {
    where.read = false;
  }

  if (type) {
    where.type = type;
  }

  // Exécuter les requêtes en parallèle
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notifications.count({ where }),
    prisma.notifications.count({
      where: {
        user_id: userId,
        read: false,
      },
    }),
  ]);

  // Formater les données
  const formattedNotifications = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.related_id,
    relatedType: notification.related_type,
    read: notification.read,
    createdAt: notification.created_at,
    readAt: notification.read_at,
    isRecent: notification.created_at
      ? Date.now() - new Date(notification.created_at).getTime() <
        24 * 60 * 60 * 1000 // Moins de 24h
      : false,
  }));

  return {
    notifications: formattedNotifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    stats: {
      unreadCount,
      totalCount: total,
    },
  };
}

// Fonction pour obtenir le nombre de notifications non lues
export async function getUnreadCount(userId: string) {
  const count = await prisma.notifications.count({
    where: {
      user_id: userId,
      read: false,
    },
  });

  return { unreadCount: count };
}
