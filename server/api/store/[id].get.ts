import prisma from '../../utils/prisma';
import { optionalAuth } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
    try {
        await optionalAuth(event);

        const id = event.context.params?.id;
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID manquant' });
        }

        const listing = await prisma.store.findUnique({
            where: { id },
            include: {
                users_store_seller_idTousers: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        classes: {
                            select: {
                                name: true,
                                level: true,
                            }
                        }
                    }
                },
                store_item: {
                    where: { active: true, deleted: false }
                }
            }
        });

        if (!listing || listing.store_item.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Annonce non trouvée' });
        }

        const items = listing.store_item;
        const mainItem = items[0];

        // Formater les conditions pour l'affichage
        const conditionMap: Record<string, string> = {
            'neuf': 'Neuf',
            'tres_bon': 'Très bon état',
            'bon': 'Bon état',
            'correct': 'Usagé',
            'abime': 'Pour pièces'
        };

        const formattedListing = {
            id: listing.id,
            status: listing.status,
            createdAt: listing.created_at,
            seller: {
                id: listing.users_store_seller_idTousers.id,
                firstName: listing.users_store_seller_idTousers.first_name,
                lastName: listing.users_store_seller_idTousers.last_name,
                email: listing.users_store_seller_idTousers.email,
                phone: listing.users_store_seller_idTousers.phone,
                className: listing.users_store_seller_idTousers.classes?.name,
                classLevel: listing.users_store_seller_idTousers.classes?.level,
            },
            item: {
                id: mainItem.id,
                name: mainItem.name,
                description: mainItem.description,
                category: mainItem.category,
                condition: mainItem.condition,
                conditionLabel: conditionMap[mainItem.condition || ''] || 'Non spécifié',
                price: parseFloat(mainItem.price.toString()),
                brand: mainItem.brand,
                images: mainItem.images,
            }
        };

        return {
            success: true,
            data: formattedListing
        };
    } catch (error: any) {
        console.error('Erreur de récupération de l\'annonce:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erreur serveur' });
    }
});
