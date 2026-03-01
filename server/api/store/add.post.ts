import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import prisma from '../../utils/prisma';
import { requireAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
    try {
        // 1. Authentifier l'utilisateur
        const user = await requireAuth(event);

        // 2. Récupérer les données sous forme de Multipart (fichiers + champs textuels)
        const formData = await readMultipartFormData(event);
        if (!formData) {
            throw createError({ statusCode: 400, statusMessage: 'Données manquantes ou format incorrect' });
        }

        let fileData: Buffer | null = null;
        let fileName = '';
        const body: Record<string, string> = {};

        // Parcourir les éléments du formData
        for (const item of formData) {
            if (item.name === 'image' && item.filename) {
                // C'est notre image
                fileData = item.data;
                const ext = path.extname(item.filename) || '.png';
                fileName = `${randomUUID()}${ext}`; // Nom de fichier unique
            } else if (item.name) {
                // C'est un champ texte
                body[item.name] = item.data.toString();
            }
        }

        if (!body.name || !body.price || !body.category) {
            throw createError({ statusCode: 400, statusMessage: 'Champs requis manquants (nom, prix, catégorie)' });
        }

        let imageUrl = '';

        // 3. Sauvegarder l'image localement si elle existe
        if (fileData) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'marketplace');
            // S'assurer que le dossier existe
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, fileData);

            // Chemin accessible depuis le front-end
            imageUrl = `/uploads/marketplace/${fileName}`;
        }

        // 4. Créer les enregistrements en base de données via une transaction
        const result = await prisma.$transaction(async (tx) => {
            // Étape A: Créer le Store (le conteneur/annonce)
            const storeRecord = await tx.store.create({
                data: {
                    seller_id: user.userId,
                    status: 'active', // Conformité avec la contrainte de base de données
                }
            });

            // Étape B: Créer le Store Item (le produit en lui-même)
            const itemRecord = await tx.store_item.create({
                data: {
                    store_id: storeRecord.id,
                    name: body.name,
                    description: body.description || null,
                    category: body.category,
                    condition: body.condition || null,
                    price: parseFloat(body.price),
                    brand: body.brand || null,
                    images: imageUrl ? [imageUrl] : [], // Stocké en tableau JSON
                    active: true,
                }
            });

            return { store: storeRecord, item: itemRecord };
        });

        return {
            success: true,
            data: result,
            message: 'Article ajouté avec succès'
        };

    } catch (error: any) {
        console.error('Erreur lors de l\'ajout de l\'article :', error);
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erreur interne du serveur'
        });
    }
});
