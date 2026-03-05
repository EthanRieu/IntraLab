import prisma from '../../utils/prisma';
import { handleAuthError } from '../../middleware/auth';
import { validateUUID } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  try {
    // Récupérer l'ID depuis les paramètres
    const itemId = getRouterParam(event, 'id');

    if (!itemId || !validateUUID(itemId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID d'item invalide",
      });
    }


    // Récupérer l'item par ID
    const item = await getItemById(itemId);

    return {
      success: true,
      data: { item },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'item:", error);
    handleAuthError(error);
  }
});

// Fonction pour récupérer un item par ID
async function getItemById(itemId: string) {
  const item = await prisma.inventory.findUnique({
    where: {
      item_id: itemId,
      deleted: false,
    },
    include: {
      loan: {
        where: {
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
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item non trouvé',
    });
  }

  // Calculer les statistiques des emprunts
  const loanStats = {
    total: item.loan.length,
    pending: item.loan.filter((loan) => loan.status === 'pending').length,
    approved: item.loan.filter((loan) => loan.status === 'approved').length,
    returned: item.loan.filter((loan) => loan.status === 'returned').length,
    overdue: item.loan.filter((loan) => loan.status === 'overdue').length,
  };

  // Formater les emprunts récents
  const recentLoans = item.loan.slice(0, 10).map((loan) => {
    const userLoan = loan.user_loan[0];
    return {
      id: loan.id,
      borrower: {
        id: loan.users.id,
        firstName: loan.users.first_name,
        lastName: loan.users.last_name,
        email: loan.users.email,
      },
      quantityRequested: loan.quantity_requested,
      quantityApproved: loan.quantity_approved,
      status: loan.status,
      createdAt: loan.created_at,
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
  });

  // Formater la réponse
  return {
    id: item.item_id,
    name: item.item_name,
    description: item.item_description,
    category: item.category,
    quantity: item.quantity,
    quantityAvailable: item.quantity_available,
    location: item.location,
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    loanStats,
    recentLoans,
    utilizationRate:
      item.quantity > 0
        ? Math.round(
          ((item.quantity - item.quantity_available) / item.quantity) * 100,
        )
        : 0,
  };
}
