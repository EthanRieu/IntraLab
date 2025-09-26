import { z } from 'zod';
import prisma from '../../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';
import { createNotification } from '../../../utils/notifications';

// Schéma de validation pour le traitement du retour
const processReturnSchema = z
  .object({
    actualReturnDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    condition: z
      .enum(['excellent', 'good', 'fair', 'damaged'], {
        message: 'L\'état doit être "excellent", "good", "fair" ou "damaged"',
      })
      .optional(),
    notes: z
      .string()
      .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
      .optional(),
    penaltyApplied: z.boolean().optional().default(false),
    penaltyReason: z
      .string()
      .max(200, 'La raison de la pénalité ne peut pas dépasser 200 caractères')
      .optional(),
  })
  .refine(
    (data) => {
      // Si une pénalité est appliquée, une raison est requise
      if (data.penaltyApplied && !data.penaltyReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Une raison est requise si une pénalité est appliquée',
      path: ['penaltyReason'],
    },
  );

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

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
    const returnData = processReturnSchema.parse(body);

    // Traiter le retour de l'item
    const loan = await processReturn(loanId, returnData, user.userId);

    return {
      success: true,
      message: 'Retour traité avec succès',
      data: { loan },
    };
  } catch (error) {
    console.error('Erreur lors du traitement du retour:', error);

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

// Fonction pour traiter le retour d'un item
async function processReturn(
  loanId: string,
  returnData: z.infer<typeof processReturnSchema>,
  processorId: string,
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

  // Calculer si l'emprunt est en retard
  const expectedReturnDate = userLoan?.date_retour_prevue;
  const actualReturnDate = returnData.actualReturnDate || new Date();
  const isLate = expectedReturnDate && actualReturnDate > expectedReturnDate;
  const daysLate = isLate
    ? Math.floor(
        (actualReturnDate.getTime() - expectedReturnDate.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Construire les notes de retour
  let returnNotes = returnData.notes || '';

  if (returnData.condition) {
    returnNotes += `\n[État du matériel] ${returnData.condition}`;
  }

  if (isLate) {
    returnNotes += `\n[Retard] ${daysLate} jour(s) de retard`;
  }

  if (returnData.penaltyApplied) {
    returnNotes += `\n[Pénalité] ${returnData.penaltyReason}`;
  }

  // Utiliser une transaction pour toutes les opérations
  const result = await prisma.$transaction(async (tx) => {
    // Mettre à jour l'emprunt
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'returned',
        updated_at: new Date(),
      },
    });

    // Mettre à jour la relation user_loan avec tous les détails du retour
    await tx.user_loan.updateMany({
      where: { loan_id: loanId },
      data: {
        date_retour_effective: actualReturnDate,
        notes: `${
          userLoan?.notes || ''
        }\n[Retour traité par ${processorId}]${returnNotes}`.trim(),
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

    // Si l'item est endommagé, décrémenter la quantité totale
    if (returnData.condition === 'damaged') {
      await tx.inventory.update({
        where: { item_id: existingLoan.inventory.item_id },
        data: {
          quantity: {
            decrement: 1,
          },
          quantity_available: {
            decrement: 1,
          },
        },
      });
    }

    return updatedLoan;
  });

  // Créer une notification pour l'emprunteur si nécessaire
  if (
    returnData.penaltyApplied ||
    returnData.condition === 'damaged' ||
    isLate
  ) {
    try {
      await createNotification({
        userId: existingLoan.borrower_id,
        type: 'loan_return_processed',
        title: "Retour d'emprunt traité",
        message: `Votre retour de "${
          existingLoan.inventory.item_name
        }" a été traité.${
          returnData.penaltyApplied ? ' Une pénalité a été appliquée.' : ''
        }`,
        relatedId: loanId,
        relatedType: 'loan',
      });
    } catch (notificationError) {
      console.error(
        "Erreur lors de l'envoi de la notification:",
        notificationError,
      );
    }
  }

  // Formater et retourner la réponse
  const finalUserLoan = await prisma.user_loan.findFirst({
    where: { loan_id: loanId },
    include: {
      users_user_loan_approved_byTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  return {
    id: existingLoan.id,
    borrower: {
      id: existingLoan.users.id,
      firstName: existingLoan.users.first_name,
      lastName: existingLoan.users.last_name,
      email: existingLoan.users.email,
    },
    item: {
      id: existingLoan.inventory.item_id,
      name: existingLoan.inventory.item_name,
      category: existingLoan.inventory.category,
      location: existingLoan.inventory.location,
    },
    quantityRequested: existingLoan.quantity_requested,
    quantityApproved: existingLoan.quantity_approved,
    status: 'returned',
    createdAt: existingLoan.created_at,
    updatedAt: result.updated_at,
    approvedBy: finalUserLoan?.users_user_loan_approved_byTousers
      ? {
          id: finalUserLoan.users_user_loan_approved_byTousers.id,
          firstName:
            finalUserLoan.users_user_loan_approved_byTousers.first_name,
          lastName: finalUserLoan.users_user_loan_approved_byTousers.last_name,
        }
      : null,
    loanDate: finalUserLoan?.date_emprunt,
    expectedReturnDate: finalUserLoan?.date_retour_prevue,
    actualReturnDate: finalUserLoan?.date_retour_effective,
    notes: finalUserLoan?.notes,
    returnDetails: {
      condition: returnData.condition,
      wasLate: isLate,
      daysLate: isLate ? daysLate : 0,
      penaltyApplied: returnData.penaltyApplied,
      penaltyReason: returnData.penaltyReason,
      processedBy: processorId,
    },
  };
}
