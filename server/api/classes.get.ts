import prisma from '../utils/prisma';

export default defineEventHandler(async () => {
    const [classes, specializations] = await Promise.all([
        prisma.classes.findMany({
            where: { deleted: false, active: true },
            select: { id: true, name: true, level: true },
            orderBy: { level: 'asc' },
        }),
        prisma.spec.findMany({
            where: { deleted: false, active: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return { success: true, data: { classes, specializations } };
});
