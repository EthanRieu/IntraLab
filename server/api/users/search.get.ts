import prisma from '../../utils/prisma';
import { requireAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
    try {
        const currentUser = await requireAuth(event);
        const query = getQuery(event);
        const search = (query.search as string) || '';
        const classSlug = (query.class as string) || '';
        const specSlug = (query.spec as string) || '';

        const where: any = {
            deleted: false,
            active: true,
            id: { not: currentUser.userId },
        };

        if (search.trim()) {
            where.OR = [
                { first_name: { contains: search.trim(), mode: 'insensitive' } },
                { last_name: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

        if (classSlug) {
            where.classes = { slug: classSlug };
        }

        if (specSlug) {
            where.spec = { slug: specSlug };
        }

        const users = await prisma.users.findMany({
            where,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_picture_url: true,
                classes: { select: { slug: true, name: true } },
                spec: { select: { slug: true, name: true } },
                roles: { select: { name: true } },
            },
            orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
            take: 50,
        });

        return {
            success: true,
            data: users.map((u) => ({
                id: u.id,
                firstName: u.first_name,
                lastName: u.last_name,
                avatar: u.profile_picture_url,
                class: u.classes ? { slug: u.classes.slug, name: u.classes.name } : null,
                specialization: u.spec ? { slug: u.spec.slug, name: u.spec.name } : null,
                role: u.roles?.name ?? null,
            })),
        };
    } catch (error: any) {
        console.error('Erreur recherche utilisateurs:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erreur interne du serveur' });
    }
});
