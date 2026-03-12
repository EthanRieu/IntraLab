<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-6xl font-bold">ARTICLES.</h1>
        <p class="text-gray-500 text-sm mt-2">
          {{ pendingArticles.length }} article{{ pendingArticles.length !== 1 ? 's' : '' }} en attente de validation
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

    <!-- Loading -->
    <div v-else-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/40"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20 text-red-400">
      <p>Erreur lors du chargement des articles.</p>
      <button @click="refresh()" class="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-white text-sm">
        Réessayer
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="!pendingArticles.length" class="text-center py-20 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg">Aucun article en attente de validation.</p>
    </div>

    <!-- Articles list -->
    <div v-else class="space-y-4">
      <div v-for="article in pendingArticles" :key="article.id"
        class="rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/15 transition-all duration-200 overflow-hidden">

        <div class="flex flex-col md:flex-row gap-4 px-5 py-5">

          <!-- Cover image -->
          <div class="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            <img v-if="article.images && (article.images as string[]).length > 0"
              :src="(article.images as string[])[0]" :alt="article.title" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <!-- Content preview -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {{ article.category || 'Sans catégorie' }}
              </span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                En attente · {{ article.waitingDays }}j
              </span>
            </div>
            <h3 class="text-white font-bold text-base leading-tight mt-1">{{ article.title }}</h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{{ article.content }}</p>
          </div>

          <!-- Author info -->
          <div class="md:w-44 shrink-0">
            <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Auteur</p>
            <p class="text-sm font-semibold text-white">{{ article.author?.firstName }} {{ article.author?.lastName }}</p>
            <p v-if="article.author?.class" class="text-xs text-gray-500">{{ article.author.class.name }}</p>
            <p class="text-xs text-gray-600 truncate">{{ article.author?.email }}</p>
            <p class="text-[11px] text-gray-600 mt-1">{{ formatDate(article.createdAt) }}</p>
          </div>

          <!-- Actions -->
          <div class="md:w-36 shrink-0 flex flex-col gap-2 justify-center">
            <button @click="openApproveModal(article)"
              class="w-full px-4 py-2 bg-green-600 text-white font-bold uppercase text-[11px] tracking-[0.12em] rounded-full hover:bg-green-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Publier
            </button>
            <button @click="openRejectModal(article)"
              class="w-full px-4 py-2 bg-red-600/80 text-white font-bold uppercase text-[11px] tracking-[0.12em] rounded-full hover:bg-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Approve confirmation modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="approveModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.7);" @click.self="closeApproveModal">
        <div class="w-full max-w-md rounded-[24px] overflow-hidden border border-white/10" style="background: #111;">

          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-bold text-white">Publier l'article</h3>
            <button @click="closeApproveModal"
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400 text-lg">✕</button>
          </div>

          <div class="px-6 py-5">
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <p class="text-sm font-bold text-white">{{ approveModal.article?.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Par <span class="text-white font-semibold">{{ approveModal.article?.author?.firstName }} {{ approveModal.article?.author?.lastName }}</span>
              </p>
            </div>
            <p class="text-sm text-gray-400 mt-4">L'article sera publié et l'auteur recevra une notification.</p>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button @click="closeApproveModal"
              class="px-5 py-2 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
              Annuler
            </button>
            <button @click="confirmApprove" :disabled="approveModal.loading"
              class="px-5 py-2 rounded-full font-bold bg-green-600 hover:bg-green-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
              <span v-if="approveModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Publier l'article
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Reject modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="rejectModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.7);" @click.self="closeRejectModal">
        <div class="w-full max-w-md rounded-[24px] overflow-hidden border border-white/10" style="background: #111;">

          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-bold text-white">Refuser l'article</h3>
            <button @click="closeRejectModal"
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400 text-lg">✕</button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <p class="text-sm font-bold text-white">{{ rejectModal.article?.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Par <span class="text-white font-semibold">{{ rejectModal.article?.author?.firstName }} {{ rejectModal.article?.author?.lastName }}</span>
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">
                Raison du refus <span class="text-red-500">*</span>
              </label>
              <textarea v-model="rejectModal.reason" rows="3"
                placeholder="Expliquez pourquoi cet article est refusé..."
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition resize-none text-sm"></textarea>
              <p v-if="rejectModal.error" class="text-xs text-red-400 mt-1">{{ rejectModal.error }}</p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button @click="closeRejectModal"
              class="px-5 py-2 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
              Annuler
            </button>
            <button @click="confirmReject" :disabled="rejectModal.loading"
              class="px-5 py-2 rounded-full font-bold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
              <span v-if="rejectModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Confirmer le refus
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

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  class: { slug: string; name: string; level: number } | null;
}

interface PendingArticle {
  id: string;
  title: string;
  content: string;
  category: string | null;
  status: string | null;
  createdAt: string | null;
  author: Author | null;
  waitingDays: number;
  images: any;
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

const { data, pending, error, refresh } = await useFetch<any>('/api/articles/pending', {
  headers: computed(() => token.value ? { Authorization: `Bearer ${token.value}` } : {} as HeadersInit),
  server: false,
});

const pendingArticles = computed<PendingArticle[]>(() => data.value?.data?.articles ?? []);

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Approve modal
const approveModal = ref<{ open: boolean; article: PendingArticle | null; loading: boolean }>({
  open: false, article: null, loading: false,
});

const openApproveModal = (article: PendingArticle) => {
  approveModal.value = { open: true, article, loading: false };
};

const closeApproveModal = () => {
  if (approveModal.value.loading) return;
  approveModal.value.open = false;
};

const confirmApprove = async () => {
  if (!approveModal.value.article) return;
  approveModal.value.loading = true;
  try {
    await $fetch(`/api/articles/${approveModal.value.article.id}/status`, {
      method: 'PUT',
      body: { status: 'published' },
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    approveModal.value.open = false;
    await refresh();
  } catch (e: any) {
    alert('Erreur : ' + (e.data?.statusMessage || 'Impossible de publier l\'article.'));
  } finally {
    approveModal.value.loading = false;
  }
};

// Reject modal
const rejectModal = ref<{ open: boolean; article: PendingArticle | null; reason: string; loading: boolean; error: string }>({
  open: false, article: null, reason: '', loading: false, error: '',
});

const openRejectModal = (article: PendingArticle) => {
  rejectModal.value = { open: true, article, reason: '', loading: false, error: '' };
};

const closeRejectModal = () => {
  if (rejectModal.value.loading) return;
  rejectModal.value.open = false;
};

const confirmReject = async () => {
  if (!rejectModal.value.article) return;
  if (!rejectModal.value.reason.trim() || rejectModal.value.reason.trim().length < 10) {
    rejectModal.value.error = 'La raison doit contenir au moins 10 caractères.';
    return;
  }
  rejectModal.value.loading = true;
  rejectModal.value.error = '';
  try {
    await $fetch(`/api/articles/${rejectModal.value.article.id}/status`, {
      method: 'PUT',
      body: { status: 'rejected', rejectionReason: rejectModal.value.reason.trim() },
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    rejectModal.value.open = false;
    await refresh();
  } catch (e: any) {
    rejectModal.value.error = e.data?.statusMessage || 'Impossible de refuser l\'article.';
  } finally {
    rejectModal.value.loading = false;
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