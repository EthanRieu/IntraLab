import prisma from '../../utils/prisma';
import { requireAuth, handleAuthError } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
    try {
        const authUser = await requireAuth(event);
        const userId = authUser.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId, deleted: false },
            include: {
                roles: { select: { id: true, slug: true, name: true } },
                classes: { select: { id: true, slug: true, name: true, level: true } },
                spec: { select: { id: true, slug: true, name: true } },
                _count: {
                    select: {
                        loan: true,
                        notifications: { where: { read: false } },
                        store_store_seller_idTousers: { where: { status: 'active' } },
                    },
                },
            },
        });

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'Utilisateur non trouvé' });
        }

        const isModerator = user.roles.slug === 'admin' || user.roles.slug === 'rp';

        // Fetch other dashboard data in parallel
        const [activeLoans, loanHistory, myArticles, myListings, pendingRequests] = await Promise.all([
            // Active loans (ongoing / approved / pending)
            prisma.loan.findMany({
                where: {
                    borrower_id: userId,
                    deleted: false,
                    status: { in: ['pending', 'approved', 'active', 'overdue'] },
                },
                include: {
                    inventory: {
                        select: { item_id: true, item_name: true, category: true, location: true },
                    },
                    user_loan: true,
                },
                orderBy: { created_at: 'desc' },
                take: 20,
            }),

            // Loan history (returned)
            prisma.loan.findMany({
                where: {
                    borrower_id: userId,
                    deleted: false,
                    status: { in: ['returned', 'rejected', 'cancelled'] },
                },
                include: {
                    inventory: {
                        select: { item_id: true, item_name: true, category: true, location: true },
                    },
                    user_loan: true,
                },
                orderBy: { updated_at: 'desc' },
                take: 20,
            }),

            // My articles
            prisma.articles.findMany({
                where: {
                    active: true,
                    deleted: false,
                    user_article: { some: { user_id: userId } },
                },
                include: {
                    user_article: {
                        select: { validated_at: true, link_to: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),

            // My marketplace listings
            prisma.store.findMany({
                where: {
                    seller_id: userId,
                },
                include: {
                    store_item: {
                        where: { active: true, deleted: false },
                        select: { id: true, name: true, price: true, category: true, condition: true, images: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),

            // Pending requests for moderators
            isModerator
                ? prisma.loan.findMany({
                    where: { status: 'pending', deleted: false },
                    include: {
                        users: { select: { id: true, first_name: true, last_name: true, email: true } },
                        inventory: { select: { item_id: true, item_name: true, category: true, location: true } },
                        user_loan: true,
                    },
                    orderBy: { created_at: 'asc' },
                })
                : Promise.resolve([]),
        ]);

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'Utilisateur non trouvé' });
        }

        const formatLoan = (loan: any) => {
            const userLoan = loan.user_loan[0];
            return {
                id: loan.id,
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
                loanDate: userLoan?.date_emprunt ?? null,
                expectedReturnDate: userLoan?.date_retour_prevue ?? null,
                actualReturnDate: userLoan?.date_retour_effective ?? null,
                notes: userLoan?.notes ?? null,
                borrower: loan.users ? {
                    id: loan.users.id,
                    firstName: loan.users.first_name,
                    lastName: loan.users.last_name,
                    email: loan.users.email,
                } : undefined,
                isOverdue:
                    userLoan?.date_retour_prevue && !userLoan?.date_retour_effective
                        ? new Date() > new Date(userLoan.date_retour_prevue)
                        : false,
            };
        };

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    active: user.active,
                    createdAt: user.created_at,
                    role: { id: user.roles.id, slug: user.roles.slug, name: user.roles.name },
                    class: user.classes
                        ? { id: user.classes.id, slug: user.classes.slug, name: user.classes.name, level: user.classes.level }
                        : null,
                    specialization: user.spec
                        ? { id: user.spec.id, slug: user.spec.slug, name: user.spec.name }
                        : null,
                    stats: {
                        activeLoans: user._count.loan,
                        unreadNotifications: user._count.notifications,
                        activeListings: user._count.store_store_seller_idTousers,
                    },
                },
                activeLoans: activeLoans.map(formatLoan),
                pendingRequests: pendingRequests.map(formatLoan),
                loanHistory: loanHistory.map(formatLoan),
                articles: myArticles.map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    content: a.content,
                    category: a.category,
                    status: a.status,
                    createdAt: a.created_at,
                    publishedAt: a.published_at,
                    images: a.images,
                })),
                listings: myListings.map((l: any) => ({
                    id: l.id,
                    status: l.status,
                    createdAt: l.created_at,
                    mainItem: l.store_item[0]
                        ? {
                            name: l.store_item[0].name,
                            price: parseFloat(l.store_item[0].price.toString()),
                            category: l.store_item[0].category,
                            condition: l.store_item[0].condition,
                            images: l.store_item[0].images,
                        }
                        : null,
                    itemCount: l.store_item.length,
                })),
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du dashboard:', error);
        handleAuthError(error);
    }
});
