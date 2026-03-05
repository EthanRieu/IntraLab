import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';
import { createNotification } from '../../utils/notifications';

// Schéma de validation pour la création d'une demande d'emprunt
const createLoanRequestSchema = z.object({
  itemId: z.string().uuid("ID d'item invalide"),
  quantityRequested: z
    .number()
    .int()
    .min(1, 'La quantité demandée doit être au moins 1')
    .max(10, 'Maximum 10 unités par demande'),
  notes: z
    .string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional(),
  expectedReturnDate: z
    .string()
    .transform((val) => new Date(val))
    .refine(
      (date) => {
        const now = new Date();
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 9); // Maximum 9 mois
        return date >= now && date <= maxDate;
      },
      {
        message:
          "La date de retour prévue doit être aujourd'hui ou dans les 9 prochains mois",
      },
    ),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer et valider les données
    const body = await readBody(event);
    const loanData = createLoanRequestSchema.parse(body);

    // Créer la demande d'emprunt
    const loan = await createLoanRequest(user.userId, loanData);

    return {
      success: true,
      message: "Demande d'emprunt créée avec succès",
      data: { loan },
    };
  } catch (error) {
    console.error("Erreur lors de la création de la demande d'emprunt:", error);

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

// Fonction pour créer une demande d'emprunt
async function createLoanRequest(
  userId: string,
  loanData: z.infer<typeof createLoanRequestSchema>,
) {
  // Vérifier que l'item existe et est disponible
  const item = await prisma.inventory.findUnique({
    where: {
      item_id: loanData.itemId,
      active: true,
      deleted: false,
    },
  });

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item non trouvé ou non disponible',
    });
  }

  // Vérifier la disponibilité
  if (item.quantity_available < loanData.quantityRequested) {
    throw createError({
      statusCode: 400,
      statusMessage: `Quantité insuffisante. Seulement ${item.quantity_available} unité(s) disponible(s)`,
    });
  }

  // Vérifier que l'utilisateur n'a pas déjà un emprunt en cours pour cet item
  const existingLoan = await prisma.loan.findFirst({
    where: {
      borrower_id: userId,
      item_id: loanData.itemId,
      status: { in: ['pending', 'approved'] },
      deleted: false,
    },
  });

  if (existingLoan) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Vous avez déjà une demande d'emprunt en cours pour cet item",
    });
  }

  // Vérifier les limites de l'utilisateur (max 5 emprunts actifs)
  const activeLoansCount = await prisma.loan.count({
    where: {
      borrower_id: userId,
      status: { in: ['pending', 'approved'] },
      deleted: false,
    },
  });

  if (activeLoansCount >= 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vous avez atteint la limite de 5 emprunts actifs',
    });
  }

  // Utiliser une transaction pour créer l'emprunt et la relation user_loan
  const result = await prisma.$transaction(async (tx) => {
    // Créer l'emprunt
    const loan = await tx.loan.create({
      data: {
        borrower_id: userId,
        item_id: loanData.itemId,
        quantity_requested: loanData.quantityRequested,
        status: 'pending',
      },
    });

    // Créer la relation user_loan avec les détails
    await tx.user_loan.create({
      data: {
        user_id: userId,
        loan_id: loan.id,
        date_retour_prevue: loanData.expectedReturnDate,
        notes: loanData.notes || null,
      },
    });

    // Récupérer l'emprunt complet avec les relations
    return await tx.loan.findUnique({
      where: { id: loan.id },
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
        user_loan: true,
      },
    });
  });

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la création de la demande d'emprunt",
    });
  }

  // Notifier les RP/Admin de la nouvelle demande
  await notifyModerators(result);

  // Formater la réponse
  const userLoan = result.user_loan[0];
  return {
    id: result.id,
    borrower: {
      id: result.users.id,
      firstName: result.users.first_name,
      lastName: result.users.last_name,
      email: result.users.email,
    },
    item: {
      id: result.inventory.item_id,
      name: result.inventory.item_name,
      category: result.inventory.category,
      location: result.inventory.location,
    },
    quantityRequested: result.quantity_requested,
    status: result.status,
    createdAt: result.created_at,
    expectedReturnDate: userLoan?.date_retour_prevue,
    notes: userLoan?.notes,
  };
}

// Fonction pour notifier les modérateurs d'une nouvelle demande d'emprunt
async function notifyModerators(loan: any) {
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
        type: 'loan_request',
        title: "Nouvelle demande d'emprunt",
        message: `${loan.users.first_name} ${loan.users.last_name} demande à emprunter "${loan.inventory.item_name}"`,
        relatedId: loan.id,
        relatedType: 'loan',
      }),
    );

    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Erreur lors de la notification des modérateurs:', error);
    // Ne pas faire échouer la création de l'emprunt pour un problème de notification
  }
}
