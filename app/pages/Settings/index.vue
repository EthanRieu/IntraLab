<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

const { token, logout } = useAuth();

const showConfirmModal = ref(false);
const isDeleting = ref(false);
const errorMessage = ref('');

const decodeToken = (t: string | null): { userId?: string } => {
    if (!t) return {};
    try {
        const part = t.split('.')[1];
        if (!part) return {};
        return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return {};
    }
};

const deleteAccount = async () => {
    const userId = decodeToken(token.value).userId;
    if (!userId) return;

    isDeleting.value = true;
    errorMessage.value = '';

    try {
        await $fetch(`/api/users/${userId}/self-delete`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token.value}` },
        });
        await logout();
    } catch (error: any) {
        errorMessage.value = error?.data?.statusMessage || 'Une erreur est survenue. Veuillez réessayer.';
        isDeleting.value = false;
        showConfirmModal.value = false;
    }
};
</script>

<template>
    <div class="container mx-auto px-4 py-8">

        <!-- Titre style Marketplace -->
        <div class="mb-10">
            <h1 class="text-4xl sm:text-6xl font-bold text-white uppercase">PARAMÈTRES.</h1>
            <p class="text-gray-400 text-sm mt-2">Gérez les préférences et la sécurité de votre compte.</p>
        </div>

        <!-- Contenu -->
        <div class="max-w-2xl space-y-4">

            <!-- Section Compte -->
            <div>
                <p class="section-label">Compte</p>
                <div class="settings-row">
                    <div class="flex items-center gap-3">
                        <div class="settings-icon-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-white">Profil</p>
                            <p class="text-xs text-gray-500">Modifier vos informations personnelles</p>
                        </div>
                    </div>
                    <NuxtLink to="/Dashboard" class="settings-btn-ghost">
                        Modifier
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </NuxtLink>
                </div>
            </div>

            <!-- Section Zone dangereuse -->
            <div class="pt-4">
                <p class="section-label text-red-500/60">Zone dangereuse</p>

                <div class="danger-card">
                    <div class="danger-glow"></div>

                    <div class="relative z-10">
                        <div class="flex items-start gap-4 mb-5">
                            <div class="danger-icon-wrap">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-red-400 mb-0.5">Actions irréversibles</h3>
                                <p class="text-xs text-gray-500 leading-relaxed">
                                    Les actions ci-dessous ne peuvent pas être annulées.<br>
                                    Procédez uniquement si vous êtes certain de votre décision.
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-red-500/10">
                            <div>
                                <p class="text-sm font-semibold text-white">Supprimer mon compte</p>
                                <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    Votre compte sera définitivement désactivé.<br>
                                    Vous perdrez l'accès à toutes vos données.
                                </p>
                            </div>
                            <button @click="showConfirmModal = true" class="delete-btn shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer mon compte
                            </button>
                        </div>

                        <p v-if="errorMessage" class="mt-4 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                            {{ errorMessage }}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Modal de confirmation -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showConfirmModal"
                class="fixed inset-0 z-50 flex items-center justify-center px-4"
                @click.self="showConfirmModal = false">
                <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

                <div class="modal-card relative z-10 w-full max-w-md">
                    <div class="h-px w-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent mb-6"></div>

                    <div class="flex items-center justify-center mb-5">
                        <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-white text-center mb-2">Supprimer votre compte ?</h3>
                    <p class="text-sm text-gray-400 text-center leading-relaxed mb-6 px-2">
                        Cette action est <span class="text-red-400 font-medium">irréversible</span>. Votre compte sera désactivé et vous ne pourrez plus vous connecter.
                    </p>

                    <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-6 space-y-2.5">
                        <div v-for="item in ['Accès au compte révoqué', 'Données personnelles anonymisées', 'Emprunts et annonces désactivés']"
                            :key="item"
                            class="flex items-center gap-2.5 text-xs text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-red-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {{ item }}
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button
                            @click="showConfirmModal = false"
                            :disabled="isDeleting"
                            class="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium disabled:opacity-40">
                            Annuler
                        </button>
                        <button
                            @click="deleteAccount"
                            :disabled="isDeleting"
                            class="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                            <svg v-if="isDeleting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            {{ isDeleting ? 'Suppression...' : 'Confirmer la suppression' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(107 114 128);
    margin-bottom: 8px;
    padding-left: 2px;
}

.settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 22px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.1) inset,
        0 8px 32px rgba(0, 0, 0, 0.25);
    transition: all 0.2s;
}

.settings-row:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

.settings-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.settings-btn-ghost {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgb(209 213 219);
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.settings-btn-ghost:hover {
    background: rgba(255, 255, 255, 0.14);
    color: white;
    border-color: rgba(255, 255, 255, 0.28);
}

.danger-card {
    position: relative;
    border-radius: 16px;
    background: rgba(30, 10, 10, 0.55);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(239, 68, 68, 0.28);
    box-shadow:
        0 1px 0 0 rgba(239, 68, 68, 0.15) inset,
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(239, 68, 68, 0.06);
    padding: 24px;
    overflow: hidden;
}

.danger-glow {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 65%);
    pointer-events: none;
}

.danger-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.delete-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.14);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: rgb(252 165 165);
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.08);
}

.delete-btn:hover {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.6);
    color: white;
    box-shadow: 0 0 24px rgba(239, 68, 68, 0.2);
}

.modal-card {
    border-radius: 20px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 24px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.08);
}

.modal-enter-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
    transition: all 0.15s ease-in;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-card {
    transform: scale(0.94) translateY(12px);
}
</style>
