import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';
import {
  createNotification,
  loanNotifications,
} from '../../utils/notifications';
import { sendAutomatedChatMessage } from '../../utils/chat';
// import { updateQuantity } from './inventory/[id].put';

// Schéma de validation pour la mise à jour d'emprunt
const updateLoanSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'return'], {
      message: 'L\'action doit être "approve", "reject" ou "return"',
    }),
    quantityApproved: z.number().int().min(1).optional(),
    rejectionReason: z
      .string()
      .min(10, 'La raison du rejet doit contenir au moins 10 caractères')
      .optional(),
    notes: z
      .string()
      .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
      .optional(),
    actualReturnDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
  })
  .refine(
    (data) => {
      // Si l'action est "approve", quantityApproved est requise
      if (data.action === 'approve' && !data.quantityApproved) {
        return false;
      }
      // Si l'action est "reject", rejectionReason est requise
      if (data.action === 'reject' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Champs requis manquants pour cette action',
    },
  );

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête PUT
    assertMethod(event, 'PUT');

    // Récupérer l'ID depuis les paramètres
    const loanId = getRouterParam(event, 'id');

    if (!loanId || !validateUUID(loanId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID d'emprunt invalide",
      });
    }

    // Vérifier les permissions (RP et Admin)
    const user = await requireAdmin(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const updateData = updateLoanSchema.parse(body);

    // Traiter l'action demandée
    let loan;
    switch (updateData.action) {
      case 'approve':
        loan = await approveLoan(
          loanId,
          updateData.quantityApproved!,
          user.userId,
          updateData.notes,
        );
        break;
      case 'reject':
        loan = await rejectLoan(
          loanId,
          updateData.rejectionReason!,
          user.userId,
        );
        break;
      case 'return':
        loan = await returnLoan(
          loanId,
          user.userId,
          updateData.actualReturnDate,
          updateData.notes,
        );
        break;
    }

    return {
      success: true,
      message: `Emprunt ${getActionMessage(updateData.action)} avec succès`,
      data: { loan },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'emprunt:", error);

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

// Fonction pour approuver un emprunt
async function approveLoan(
  loanId: string,
  quantityApproved: number,
  approverId: string,
  notes?: string,
) {
  // Récupérer l'emprunt existant
  const existingLoan = await prisma.loan.findUnique({
    where: {
      id: loanId,
      deleted: false,
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      inventory: {
        select: {
          item_id: true,
          item_name: true,
          quantity_available: true,
        },
      },
      user_loan: true,
    },
  });

  if (!existingLoan) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Emprunt non trouvé',
    });
  }

  if (existingLoan.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Seuls les emprunts en attente peuvent être approuvés',
    });
  }

  // Vérifier la disponibilité
  if (existingLoan.inventory.quantity_available < quantityApproved) {
    throw createError({
      statusCode: 400,
      statusMessage: `Quantité insuffisante. Seulement ${existingLoan.inventory.quantity_available} unité(s) disponible(s)`,
    });
  }

  // Utiliser une transaction pour toutes les opérations
  const result = await prisma.$transaction(async (tx: any) => {
    // Mettre à jour l'emprunt
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'approved',
        quantity_approved: quantityApproved,
        updated_at: new Date(),
      },
    });

    // Mettre à jour la relation user_loan
    await tx.user_loan.updateMany({
      where: { loan_id: loanId },
      data: {
        approved_by: approverId,
        date_emprunt: new Date(),
        notes: notes || null,
      },
    });

    // Mettre à jour la quantité disponible dans l'inventaire
    await tx.inventory.update({
      where: { item_id: existingLoan.inventory.item_id },
      data: {
        quantity_available: {
          decrement: quantityApproved,
        },
        updated_at: new Date(),
      },
    });

    return updatedLoan;
  });

  // Envoyer une notification à l'emprunteur
  try {
    const notification = loanNotifications.approved(
      existingLoan.users.first_name,
      existingLoan.inventory.item_name,
    );

    await createNotification({
      userId: existingLoan.borrower_id,
      ...notification,
      relatedId: loanId,
      relatedType: 'loan',
    });

    // Send an automated chat message
    const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const startDate = new Date();

    // Attempt to extract the date limit from `expectedReturnDate` which was stored in `date_retour_prevue` during request phase
    const userLoan = existingLoan.user_loan[0];
    const expectedReturnDateText = userLoan?.date_retour_prevue
      ? formatDate(new Date(userLoan.date_retour_prevue))
      : 'une date indéterminée';

    const messageContent = `Salut ${existingLoan.users.first_name}, bonne nouvelle ! Ta demande d'emprunt pour "${existingLoan.inventory.item_name}" a été **approuvée**. N'oublie pas de rendre le matériel avant le ${expectedReturnDateText}. Merci !`;

    await sendAutomatedChatMessage(approverId, existingLoan.borrower_id, messageContent);

  } catch (notificationError) {
    console.error(
      "Erreur lors de l'envoi de la notification / message chat:",
      notificationError,
    );
  }

  return await getLoanById(loanId);
}

// Fonction pour rejeter un emprunt
async function rejectLoan(
  loanId: string,
  rejectionReason: string,
  rejectorId: string,
) {
  // Récupérer l'emprunt existant
  const existingLoan = await prisma.loan.findUnique({
    where: {
      id: loanId,
      deleted: false,
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      inventory: {
        select: {
          item_name: true,
        },
      },
    },
  });

  if (!existingLoan) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Emprunt non trouvé',
    });
  }

  if (existingLoan.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Seuls les emprunts en attente peuvent être rejetés',
    });
  }

  // Utiliser une transaction pour les mises à jour
  const result = await prisma.$transaction(async (tx: any) => {
    // Mettre à jour l'emprunt
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'rejected',
        updated_at: new Date(),
      },
    });

    // Mettre à jour la relation user_loan avec les détails du rejet
    await tx.user_loan.updateMany({
      where: { loan_id: loanId },
      data: {
        approved_by: rejectorId,
        notes: rejectionReason,
      },
    });

    return updatedLoan;
  });

  // Envoyer une notification à l'emprunteur
  try {
    const notification = loanNotifications.rejected(
      existingLoan.users.first_name,
      existingLoan.inventory.item_name,
      rejectionReason,
    );

    await createNotification({
      userId: existingLoan.borrower_id,
      ...notification,
      relatedId: loanId,
      relatedType: 'loan',
    });

    // Send an automated chat message for rejection
    const messageContent = `Bonjour ${existingLoan.users.first_name}, au sujet de ta demande pour "${existingLoan.inventory.item_name}", celle-ci a été refusée.\n\n**Motif** : ${rejectionReason}`;
    await sendAutomatedChatMessage(rejectorId, existingLoan.borrower_id, messageContent);

  } catch (notificationError) {
    console.error(
      "Erreur lors de l'envoi de la notification ou du message de chat:",
      notificationError,
    );
  }

  return await getLoanById(loanId);
}

// Fonction pour marquer un emprunt comme rendu
async function returnLoan(
  loanId: string,
  returnProcessorId: string,
  actualReturnDate?: Date,
  notes?: string,
) {
  // Récupérer l'emprunt existant
  const existingLoan = await prisma.loan.findUnique({
    where: {
      id: loanId,
      deleted: false,
    },
    include: {
      inventory: {
        select: {
          item_id: true,
        },
      },
      user_loan: true,
    },
  });

  if (!existingLoan) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Emprunt non trouvé',
    });
  }

  if (existingLoan.status !== 'approved') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Seuls les emprunts approuvés peuvent être retournés',
    });
  }

  const userLoan = existingLoan.user_loan[0];
  if (userLoan?.date_retour_effective) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cet emprunt a déjà été retourné',
    });
  }

  // Utiliser une transaction pour toutes les opérations
  const result = await prisma.$transaction(async (tx: any) => {
    // Mettre à jour l'emprunt
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'returned',
        updated_at: new Date(),
      },
    });

    // Mettre à jour la relation user_loan
    await tx.user_loan.updateMany({
      where: { loan_id: loanId },
      data: {
        date_retour_effective: actualReturnDate || new Date(),
        notes: notes
          ? `${userLoan?.notes || ''}\n[Retour] ${notes}`.trim()
          : userLoan?.notes,
      },
    });

    // Remettre la quantité dans l'inventaire
    await tx.inventory.update({
      where: { item_id: existingLoan.inventory.item_id },
      data: {
        quantity_available: {
          increment: existingLoan.quantity_approved || 0,
        },
        updated_at: new Date(),
      },
    });

    return updatedLoan;
  });

  return await getLoanById(loanId);
}

// Fonction utilitaire pour récupérer un emprunt complet par ID
async function getLoanById(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      inventory: {
        select: {
          item_id: true,
          item_name: true,
          category: true,
          location: true,
        },
      },
      user_loan: {
        include: {
          users_user_loan_approved_byTousers: {
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

  if (!loan) return null;

  const userLoan = loan.user_loan[0];
  return {
    id: loan.id,
    borrower: {
      id: loan.users.id,
      firstName: loan.users.first_name,
      lastName: loan.users.last_name,
      email: loan.users.email,
    },
    item: {
      id: loan.inventory.item_id,
      name: loan.inventory.item_name,
      category: loan.inventory.category,
      location: loan.inventory.location,
    },
    quantityRequested: loan.quantity_requested,
    quantityApproved: loan.quantity_approved,
    status: loan.status,
    createdAt: loan.created_at,
    updatedAt: loan.updated_at,
    approvedBy: userLoan?.users_user_loan_approved_byTousers
      ? {
        id: userLoan.users_user_loan_approved_byTousers.id,
        firstName: userLoan.users_user_loan_approved_byTousers.first_name,
        lastName: userLoan.users_user_loan_approved_byTousers.last_name,
      }
      : null,
    loanDate: userLoan?.date_emprunt,
    expectedReturnDate: userLoan?.date_retour_prevue,
    actualReturnDate: userLoan?.date_retour_effective,
    notes: userLoan?.notes,
  };
}

// Fonction utilitaire pour les messages d'action
function getActionMessage(action: string): string {
  switch (action) {
    case 'approve':
      return 'approuvé';
    case 'reject':
      return 'rejeté';
    case 'return':
      return 'retourné';
    default:
      return 'traité';
  }
}
