import prisma from '../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  try {
    // Vérifier les permissions (Admin uniquement)
    await requireAdmin(event);

    // Récupérer les statistiques du tableau de bord
    const stats = await getDashboardStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    handleAuthError(error);
  }
});

// Fonction pour récupérer les statistiques du tableau de bord
async function getDashboardStats() {
  // Exécuter toutes les requêtes en parallèle pour optimiser les performances
  const [
    userStats,
    articleStats,
    loanStats,
    inventoryStats,
    storeStats,
    notificationStats,
    recentActivity,
  ] = await Promise.all([
    getUserStats(),
    getArticleStats(),
    getLoanStats(),
    getInventoryStats(),
    getStoreStats(),
    getNotificationStats(),
    getRecentActivity(),
  ]);

  return {
    users: userStats,
    articles: articleStats,
    loans: loanStats,
    inventory: inventoryStats,
    store: storeStats,
    notifications: notificationStats,
    recentActivity,
    generatedAt: new Date(),
  };
}

// Statistiques des utilisateurs
async function getUserStats() {
  const [total, active, byRoleRaw, byClass, recentRegistrations, roles] =
    await Promise.all([
      prisma.users.count({ where: { deleted: false } }),
      prisma.users.count({ where: { deleted: false, active: true } }),
      prisma.users.groupBy({
        by: ['role_id'],
        where: { deleted: false, active: true },
        _count: { id: true },
      }),
      prisma.users.groupBy({
        by: ['class_id'],
        where: { deleted: false, active: true, class_id: { not: null } },
        _count: { id: true },
      }),
      prisma.users.count({
        where: {
          deleted: false,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
          },
        },
      }),
      prisma.roles.findMany({
        select: { id: true, slug: true, name: true },
      }),
    ]);

  // Enrichir les données byRole avec les informations des rôles
  const byRole = byRoleRaw.map((roleData) => {
    const role = roles.find((r) => r.id === roleData.role_id);
    return {
      ...roleData,
      role: role ? { slug: role.slug, name: role.name } : null,
    };
  });

  return {
    total,
    active,
    inactive: total - active,
    recentRegistrations,
    byRole: byRole,
    byClass: byClass,
  };
}

// Statistiques des articles
async function getArticleStats() {
  const [total, published, pending, rejected, byCategory] = await Promise.all([
    prisma.articles.count({ where: { deleted: false, active: true } }),
    prisma.articles.count({
      where: { deleted: false, active: true, status: 'published' },
    }),
    prisma.articles.count({
      where: { deleted: false, active: true, status: 'pending' },
    }),
    prisma.articles.count({
      where: { deleted: false, active: true, status: 'rejected' },
    }),
    prisma.articles.groupBy({
      by: ['category'],
      where: {
        deleted: false,
        active: true,
        status: 'published',
        category: { not: null },
      },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    published,
    pending,
    rejected,
    draft: total - published - pending - rejected,
    byCategory,
  };
}

// Statistiques des emprunts
async function getLoanStats() {
  const [total, pending, approved, returned, overdue, topBorrowers] =
    await Promise.all([
      prisma.loan.count({ where: { deleted: false } }),
      prisma.loan.count({ where: { deleted: false, status: 'pending' } }),
      prisma.loan.count({ where: { deleted: false, status: 'approved' } }),
      prisma.loan.count({ where: { deleted: false, status: 'returned' } }),
      prisma.user_loan.count({
        where: {
          date_retour_prevue: { lt: new Date() },
          date_retour_effective: null,
        },
      }),
      prisma.loan.groupBy({
        by: ['borrower_id'],
        where: { deleted: false },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

  return {
    total,
    pending,
    approved,
    returned,
    rejected: total - pending - approved - returned,
    overdue,
    topBorrowers,
  };
}

// Statistiques de l'inventaire
async function getInventoryStats() {
  const [totalItems, totalQuantity, availableQuantity, byCategory, lowStock] =
    await Promise.all([
      prisma.inventory.count({ where: { deleted: false, active: true } }),
      prisma.inventory.aggregate({
        where: { deleted: false, active: true },
        _sum: { quantity: true },
      }),
      prisma.inventory.aggregate({
        where: { deleted: false, active: true },
        _sum: { quantity_available: true },
      }),
      prisma.inventory.groupBy({
        by: ['category'],
        where: { deleted: false, active: true, category: { not: null } },
        _count: { item_id: true },
        _sum: { quantity: true },
      }),
      prisma.inventory.count({
        where: {
          deleted: false,
          active: true,
          quantity_available: { lte: 2 }, // Stock faible
        },
      }),
    ]);

  const utilizationRate = totalQuantity._sum.quantity
    ? Math.round(
        ((totalQuantity._sum.quantity -
          (availableQuantity._sum.quantity_available || 0)) /
          totalQuantity._sum.quantity) *
          100,
      )
    : 0;

  return {
    totalItems,
    totalQuantity: totalQuantity._sum.quantity || 0,
    availableQuantity: availableQuantity._sum.quantity_available || 0,
    utilizationRate,
    lowStock,
    byCategory,
  };
}

// Statistiques du store
async function getStoreStats() {
  const [totalListings, activeListings, soldListings, byCategory, avgPrice] =
    await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: 'active' } }),
      prisma.store.count({ where: { status: 'sold' } }),
      prisma.store_item.groupBy({
        by: ['category'],
        where: { deleted: false, active: true, category: { not: null } },
        _count: { id: true },
      }),
      prisma.store_item.aggregate({
        where: { deleted: false, active: true },
        _avg: { price: true },
      }),
    ]);

  return {
    totalListings,
    activeListings,
    soldListings,
    inactiveListings: totalListings - activeListings - soldListings,
    byCategory,
    averagePrice: avgPrice._avg.price
      ? parseFloat(avgPrice._avg.price.toString())
      : 0,
  };
}

// Statistiques des notifications
async function getNotificationStats() {
  const [total, unread, byType] = await Promise.all([
    prisma.notifications.count(),
    prisma.notifications.count({ where: { read: false } }),
    prisma.notifications.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  return {
    total,
    unread,
    read: total - unread,
    byType,
  };
}

// Activité récente
async function getRecentActivity() {
  const [recentUsers, recentArticles, recentLoans, recentListings] =
    await Promise.all([
      prisma.users.findMany({
        where: { deleted: false },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          created_at: true,
          roles: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.articles.findMany({
        where: { deleted: false, active: true },
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.loan.findMany({
        where: { deleted: false },
        select: {
          id: true,
          status: true,
          created_at: true,
          users: {
            select: {
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
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.store.findMany({
        where: {},
        select: {
          id: true,
          status: true,
          created_at: true,
          users_store_seller_idTousers: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          store_item: {
            select: {
              name: true,
            },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

  return {
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.roles.name,
      createdAt: user.created_at,
    })),
    recentArticles: recentArticles.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      createdAt: article.created_at,
    })),
    recentLoans: recentLoans.map((loan) => ({
      id: loan.id,
      borrower: `${loan.users.first_name} ${loan.users.last_name}`,
      item: loan.inventory.item_name,
      status: loan.status,
      createdAt: loan.created_at,
    })),
    recentListings: recentListings.map((listing) => ({
      id: listing.id,
      seller: `${listing.users_store_seller_idTousers.first_name} ${listing.users_store_seller_idTousers.last_name}`,
      item: listing.store_item[0]?.name || 'N/A',
      status: listing.status,
      createdAt: listing.created_at,
    })),
  };
}
