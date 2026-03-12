<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-6xl font-bold">UTILISATEURS.</h1>
        <p class="text-gray-500 text-sm mt-2">
          {{ pagination.total }} utilisateur{{ pagination.total !== 1 ? 's' : '' }}
          <span v-if="filterActive !== null"> · filtre : {{ filterActive ? 'actifs' : 'bloqués' }}</span>
        </p>
      </div>

      <button @click="refresh()"
        class="p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition text-gray-400 hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Access denied -->
    <div v-if="!canManage" class="text-center py-20 text-gray-400">
      <p class="text-xl">Accès réservé aux administrateurs et RP.</p>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Rechercher un utilisateur..."
            class="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition text-sm" />
        </div>

        <div class="flex gap-2">
          <button @click="setActiveFilter(null)"
            :class="filterActive === null ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'"
            class="px-4 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-wider transition border border-white/10">
            Tous
          </button>
          <button @click="setActiveFilter(true)"
            :class="filterActive === true ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'"
            class="px-4 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-wider transition border border-white/10">
            Actifs
          </button>
          <button @click="setActiveFilter(false)"
            :class="filterActive === false ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'"
            class="px-4 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-wider transition border border-white/10">
            Bloqués
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/40"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20 text-red-400">
        <p>Erreur lors du chargement des utilisateurs.</p>
        <button @click="refresh()" class="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-white text-sm">
          Réessayer
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="!users.length" class="text-center py-20 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-lg">Aucun utilisateur trouvé.</p>
      </div>

      <!-- Users list -->
      <div v-else class="space-y-3">
        <div v-for="u in users" :key="u.id"
          class="rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/15 transition-all duration-200 overflow-hidden">

          <div class="flex flex-col md:flex-row gap-4 px-5 py-4 items-center">

            <!-- Avatar placeholder -->
            <div class="shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white/60">
              {{ u.firstName[0] }}{{ u.lastName[0] }}
            </div>

            <!-- User info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-white font-bold text-sm">{{ u.firstName }} {{ u.lastName }}</span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  :class="{
                    'bg-purple-500/15 text-purple-400 border-purple-500/30': u.role.slug === 'rp',
                    'bg-blue-500/15 text-blue-400 border-blue-500/30': u.role.slug === 'admin',
                    'bg-white/5 text-gray-400 border-white/10': u.role.slug === 'student',
                  }">
                  {{ u.role.name }}
                </span>
                <span v-if="!u.active"
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  Bloqué
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 truncate">{{ u.email }}</p>
              <p v-if="u.class" class="text-xs text-gray-600">{{ u.class.name }}</p>
            </div>

            <!-- Action -->
            <div class="shrink-0">
              <button @click="openModal(u)"
                :class="u.active
                  ? 'bg-red-600/80 hover:bg-red-500'
                  : 'bg-green-600/80 hover:bg-green-500'"
                class="px-4 py-2 text-white font-bold uppercase text-[11px] tracking-[0.12em] rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
                <svg v-if="u.active" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {{ u.active ? 'Bloquer' : 'Débloquer' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="mt-6 flex justify-center gap-2">
        <button @click="goToPage(currentPage - 1)" :disabled="!pagination.hasPrev"
          class="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
          Précédent
        </button>
        <span class="px-4 py-2 text-sm text-gray-500">
          {{ currentPage }} / {{ pagination.totalPages }}
        </span>
        <button @click="goToPage(currentPage + 1)" :disabled="!pagination.hasNext"
          class="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
          Suivant
        </button>
      </div>
    </template>
  </div>

  <!-- Confirmation modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.7);" @click.self="closeModal">
        <div class="w-full max-w-md rounded-[24px] overflow-hidden border border-white/10" style="background: #111;">

          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-bold text-white">
              {{ modal.user?.active ? 'Bloquer le compte' : 'Débloquer le compte' }}
            </h3>
            <button @click="closeModal"
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400 text-lg">✕</button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <p class="text-sm font-bold text-white">{{ modal.user?.firstName }} {{ modal.user?.lastName }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ modal.user?.email }}</p>
            </div>

            <p v-if="modal.user?.active" class="text-sm text-gray-400">
              L'utilisateur ne pourra plus se connecter à la plateforme.
            </p>
            <p v-else class="text-sm text-gray-400">
              L'utilisateur pourra de nouveau accéder à la plateforme.
            </p>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button @click="closeModal"
              class="px-5 py-2 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
              Annuler
            </button>
            <button @click="confirmAction" :disabled="modal.loading"
              :class="modal.user?.active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'"
              class="px-5 py-2 rounded-full font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
              <span v-if="modal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              {{ modal.user?.active ? 'Confirmer le blocage' : 'Débloquer' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';

const { token } = useAuth();

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean | null;
  role: { slug: string; name: string };
  class: { slug: string; name: string } | null;
}

const getRoleFromToken = (t: string | null): string | null => {
  if (!t) return null;
  try {
    const part = t.split('.')[1];
    if (!part) return null;
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.roleSlug ?? null;
  } catch {
    return null;
  }
};

const canManage = computed(() =>
  ['rp', 'admin'].includes(getRoleFromToken(token.value) ?? '')
);

const currentPage = ref(1);
const searchQuery = ref('');
const filterActive = ref<boolean | null>(null);

const fetchQuery = computed(() => {
  const q: Record<string, string> = { page: String(currentPage.value), limit: '20' };
  if (searchQuery.value.trim()) q.search = searchQuery.value.trim();
  if (filterActive.value !== null) q.active = String(filterActive.value);
  return q;
});

const { data, pending, error, refresh } = await useFetch<any>('/api/users', {
  query: fetchQuery,
  headers: computed(() => token.value ? { Authorization: `Bearer ${token.value}` } : {} as HeadersInit),
  server: false,
  watch: [fetchQuery],
});

const users = computed<UserItem[]>(() => data.value?.data?.users ?? []);
const pagination = computed(() => data.value?.data?.pagination ?? { total: 0, totalPages: 1, hasPrev: false, hasNext: false });

const goToPage = (page: number) => {
  currentPage.value = page;
};

const setActiveFilter = (val: boolean | null) => {
  filterActive.value = val;
  currentPage.value = 1;
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
  }, 350);
};

// Modal
const modal = ref<{ open: boolean; user: UserItem | null; loading: boolean }>({
  open: false, user: null, loading: false,
});

const openModal = (u: UserItem) => {
  modal.value = { open: true, user: u, loading: false };
};

const closeModal = () => {
  if (modal.value.loading) return;
  modal.value.open = false;
};

const confirmAction = async () => {
  if (!modal.value.user) return;
  modal.value.loading = true;
  try {
    await $fetch(`/api/users/${modal.value.user.id}/block`, {
      method: 'PUT',
      body: { blocked: modal.value.user.active },
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    modal.value.open = false;
    await refresh();
  } catch (e: any) {
    alert('Erreur : ' + (e.data?.statusMessage || 'Impossible de modifier le compte.'));
  } finally {
    modal.value.loading = false;
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .rounded-\[24px\],
.modal-leave-active .rounded-\[24px\] {
  transition: transform 0.2s ease;
}
.modal-enter-from .rounded-\[24px\],
.modal-leave-to .rounded-\[24px\] {
  transform: scale(0.96);
}
</style>
