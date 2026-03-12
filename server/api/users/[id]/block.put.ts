import { z } from 'zod';
import prisma from '../../../utils/prisma';
import { requireAdmin, handleAuthError } from '../../../middleware/auth';
import { validateUUID } from '../../../utils/validation';

const blockSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().max(500).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    assertMethod(event, 'PUT');

    const currentUser = await requireAdmin(event);

    const targetId = getRouterParam(event, 'id');
    if (!targetId || !validateUUID(targetId)) {
      throw createError({ statusCode: 400, statusMessage: 'ID utilisateur invalide' });
    }

    // Empêcher de se bloquer soi-même
    if (targetId === currentUser.userId) {
      throw createError({ statusCode: 400, statusMessage: 'Vous ne pouvez pas bloquer votre propre compte' });
    }

    const body = await readBody(event);
    const { blocked } = blockSchema.parse(body);

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.users.findUnique({
      where: { id: targetId, deleted: false },
      include: { roles: { select: { slug: true } } },
    });

    if (!targetUser) {
      throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' });
    }

    // Un admin ne peut pas bloquer un RP
    if (currentUser.roleSlug === 'admin' && targetUser.roles.slug === 'rp') {
      throw createError({ statusCode: 403, statusMessage: 'Permissions insuffisantes pour bloquer un RP' });
    }

    const updated = await prisma.users.update({
      where: { id: targetId },
      data: { active: !blocked, updated_at: new Date() },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        active: true,
      },
    });

    return {
      success: true,
      message: blocked ? 'Compte bloqué avec succès' : 'Compte débloqué avec succès',
      data: {
        user: {
          id: updated.id,
          firstName: updated.first_name,
          lastName: updated.last_name,
          email: updated.email,
          active: updated.active,
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
    }
    handleAuthError(error);
  }
});
