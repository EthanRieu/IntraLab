import prisma from './prisma';
import type { notifications } from '@prisma/client';

export type NotificationType =
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_overdue'
  | 'loan_reminder'
  | 'loan_return_processed'
  | 'loan_request'
  | 'article_published'
  | 'article_rejected'
  | 'article_pending'
  | 'store_purchase'
  | 'user_validation'
  | 'system_announcement';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedId?: string;
  relatedType?: string;
}

// Créer une notification
export const createNotification = async (
  data: CreateNotificationData,
): Promise<notifications> => {
  try {
    return await prisma.notifications.create({
      data: {
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        related_id: data.relatedId,
        related_type: data.relatedType,
        read: false,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw new Error('Impossible de créer la notification');
  }
};

// Envoyer une notification à un utilisateur spécifique
export const sendNotificationToUser = async (
  userId: string,
  notification: Omit<CreateNotificationData, 'userId'>,
): Promise<notifications> => {
  return createNotification({ ...notification, userId });
};

// Envoyer des notifications à plusieurs utilisateurs
export const sendNotificationToUsers = async (
  userIds: string[],
  notification: Omit<CreateNotificationData, 'userId'>,
): Promise<notifications[]> => {
  const notifications = await Promise.allSettled(
    userIds.map((userId) => createNotification({ ...notification, userId })),
  );

  return notifications
    .filter(
      (result): result is PromiseFulfilledResult<notifications> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value);
};

// Notifications prédéfinies pour les emprunts
export const loanNotifications = {
  approved: (borrowerName: string, itemName: string) => ({
    type: 'loan_approved' as NotificationType,
    title: 'Emprunt approuvé',
    message: `Votre demande d'emprunt pour "${itemName}" a été approuvée.`,
  }),

  rejected: (borrowerName: string, itemName: string, reason?: string) => ({
    type: 'loan_rejected' as NotificationType,
    title: 'Emprunt rejeté',
    message: `Votre demande d'emprunt pour "${itemName}" a été rejetée.${reason ? ` Raison: ${reason}` : ''
      }`,
  }),

  overdue: (borrowerName: string, itemName: string, daysOverdue: number) => ({
    type: 'loan_overdue' as NotificationType,
    title: 'Emprunt en retard',
    message: `L'item "${itemName}" est en retard de ${daysOverdue} jour(s). Merci de le retourner rapidement.`,
  }),

  reminder: (borrowerName: string, itemName: string, daysUntilDue: number) => ({
    type: 'loan_reminder' as NotificationType,
    title: 'Rappel de retour',
    message: `N'oubliez pas de retourner "${itemName}" dans ${daysUntilDue} jour(s).`,
  }),
};

// Notifications prédéfinies pour les articles
export const articleNotifications = {
  published: (authorName: string, articleTitle: string) => ({
    type: 'article_published' as NotificationType,
    title: 'Article publié',
    message: `Votre article "${articleTitle}" a été publié avec succès.`,
  }),

  rejected: (authorName: string, articleTitle: string, reason?: string) => ({
    type: 'article_rejected' as NotificationType,
    title: 'Article rejeté',
    message: `Votre article "${articleTitle}" a été rejeté.${reason ? ` Raison: ${reason}` : ''
      }`,
  }),
};

// Notifications prédéfinies pour le store
export const storeNotifications = {
  purchase: (sellerName: string, itemName: string, buyerName: string) => ({
    type: 'store_purchase' as NotificationType,
    title: 'Article vendu',
    message: `Votre article "${itemName}" a été acheté par ${buyerName}.`,
  }),
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
): Promise<notifications | null> => {
  try {
    return await prisma.notifications.update({
      where: {
        id: notificationId,
        user_id: userId, // S'assurer que l'utilisateur peut seulement marquer ses propres notifications
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    return null;
  }
};

// Marquer toutes les notifications d'un utilisateur comme lues
export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<{ count: number }> => {
  try {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read: false,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });

    return { count: result.count };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    throw new Error('Impossible de marquer les notifications comme lues');
  }
};
