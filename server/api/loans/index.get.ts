import { z } from 'zod';
import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

// Schéma pour les paramètres de requête
const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  status: z.string().optional(),
  userId: z.string().optional(),
  itemId: z.string().optional(),
  overdue: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  dateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Récupérer les emprunts avec filtres
    const result = await getAllLoans(event, user);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des emprunts:', error);

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

// Fonction pour récupérer tous les emprunts
async function getAllLoans(event: H3Event, user: any) {
  const query = getQuery(event);
  const { page, limit, status, userId, itemId, overdue, dateFrom, dateTo } =
    querySchema.parse(query);

  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    deleted: false,
  };

  // Les étudiants ne voient que leurs propres emprunts
  if (user.roleSlug === 'student') {
    where.borrower_id = user.userId;
  } else if (userId) {
    // Admin/RP peuvent filtrer par utilisateur
    where.borrower_id = userId;
  }

  if (status) {
    where.status = status;
  }

  if (itemId) {
    where.item_id = itemId;
  }

  if (overdue) {
    where.status = 'overdue';
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at.gte = dateFrom;
    }
    if (dateTo) {
      where.created_at.lte = dateTo;
    }
  }

  // Exécuter les requêtes en parallèle
  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: {
        users: {
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
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.loan.count({ where }),
  ]);

  // Formater les données
  const formattedLoans = loans.map((loan) => {
    const userLoan = loan.user_loan[0];

    return {
      id: loan.id,
      borrower: {
        id: loan.users.id,
        firstName: loan.users.first_name,
        lastName: loan.users.last_name,
        email: loan.users.email,
        class: loan.users.classes
          ? {
              slug: loan.users.classes.slug,
              name: loan.users.classes.name,
              level: loan.users.classes.level,
            }
          : null,
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
      isOverdue:
        userLoan?.date_retour_prevue && !userLoan?.date_retour_effective
          ? new Date() > new Date(userLoan.date_retour_prevue)
          : false,
    };
  });

  return {
    loans: formattedLoans,
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

// Fonction pour récupérer les emprunts d'un utilisateur
export async function getLoansByUser(userId: string) {
  const loans = await prisma.loan.findMany({
    where: {
      borrower_id: userId,
      deleted: false,
    },
    include: {
      inventory: {
        select: {
          item_id: true,
          item_name: true,
          category: true,
        },
      },
      user_loan: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return loans.map((loan) => {
    const userLoan = loan.user_loan[0];
    return {
      id: loan.id,
      item: {
        id: loan.inventory.item_id,
        name: loan.inventory.item_name,
        category: loan.inventory.category,
      },
      quantityRequested: loan.quantity_requested,
      quantityApproved: loan.quantity_approved,
      status: loan.status,
      createdAt: loan.created_at,
      loanDate: userLoan?.date_emprunt,
      expectedReturnDate: userLoan?.date_retour_prevue,
      actualReturnDate: userLoan?.date_retour_effective,
      isOverdue:
        userLoan?.date_retour_prevue && !userLoan?.date_retour_effective
          ? new Date() > new Date(userLoan.date_retour_prevue)
          : false,
    };
  });
}

// Fonction pour récupérer les emprunts en retard
export async function getOverdueLoans() {
  const overdueLoans = await prisma.user_loan.findMany({
    where: {
      date_retour_prevue: {
        lt: new Date(),
      },
      date_retour_effective: null,
    },
    include: {
      loan: {
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
              item_name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return overdueLoans.map((userLoan) => ({
    loanId: userLoan.loan.id,
    borrower: {
      id: userLoan.loan.users.id,
      firstName: userLoan.loan.users.first_name,
      lastName: userLoan.loan.users.last_name,
      email: userLoan.loan.users.email,
    },
    item: {
      name: userLoan.loan.inventory.item_name,
      category: userLoan.loan.inventory.category,
    },
    expectedReturnDate: userLoan.date_retour_prevue,
    daysOverdue: Math.floor(
      (Date.now() - new Date(userLoan.date_retour_prevue!).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  }));
}
