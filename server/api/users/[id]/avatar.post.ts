import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import prisma from '../../../utils/prisma';
import { requireOwnershipOrAdmin, handleAuthError } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
    try {
        const userId = getRouterParam(event, 'id');

        if (!userId || !validateUUID(userId)) {
            throw createError({ statusCode: 400, statusMessage: 'ID utilisateur invalide' });
        }

        await requireOwnershipOrAdmin(() => userId)(event);

        const formData = await readMultipartFormData(event);
        if (!formData) {
            throw createError({ statusCode: 400, statusMessage: 'Données manquantes' });
        }

        let fileData: Buffer | null = null;
        let fileName = '';

        for (const item of formData) {
            if (item.name === 'avatar' && item.filename) {
                fileData = item.data;
                const ext = path.extname(item.filename) || '.png';
                fileName = `${randomUUID()}${ext}`;
            }
        }

        if (!fileData) {
            throw createError({ statusCode: 400, statusMessage: 'Aucune image fournie' });
        }

        // Save file to public/uploads/avatars/
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, fileName), fileData);

        const avatarUrl = `/uploads/avatars/${fileName}`;

        // Persist the avatar URL in the database
        await prisma.users.update({
            where: { id: userId },
            data: { profile_picture_url: avatarUrl },
        });

        return {
            success: true,
            data: { avatarUrl },
        };
    } catch (error) {
        console.error("Erreur lors de l'upload d'avatar:", error);
        handleAuthError(error);
    }
});
