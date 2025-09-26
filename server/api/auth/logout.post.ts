import { requireAuth, handleAuthError } from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  try {
    // Vérifier que c'est bien une requête POST
    assertMethod(event, 'POST');

    // Vérifier l'authentification
    const user = await requireAuth(event);

    // Effectuer la déconnexion
    await logoutUser(user.userId);

    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    handleAuthError(error);
  }
});

// Fonction pour déconnecter un utilisateur
async function logoutUser(userId: string): Promise<void> {
  // Dans une implémentation plus avancée, on pourrait :
  // 1. Ajouter le token à une blacklist
  // 2. Mettre à jour la dernière déconnexion en base
  // 3. Invalider les sessions actives

  // Pour l'instant, on simule juste une déconnexion réussie
  // La déconnexion côté client se fera en supprimant le token du localStorage

  console.log(`Utilisateur ${userId} déconnecté`);
}
