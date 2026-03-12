<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col gap-4">
      <h1 class="text-4xl sm:text-6xl font-bold">BLOG.</h1>

      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
        <!-- Search Pill -->
        <div class="relative flex-1 sm:flex-none">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input v-model="search" type="text" placeholder="Rechercher un article"
            class="w-full sm:w-64 md:w-80 pl-10 pr-4 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]" />
        </div>

        <!-- Category Pill -->
        <div class="relative">
          <select v-model="selectedCategory"
            class="appearance-none w-full sm:w-auto pl-4 pr-10 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]">
            <option value="">Catégories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Create Button -->
        <button v-if="isAuthenticated" @click="isCreateModalOpen = true"
          class="ml-auto px-4 sm:px-5 py-2 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Créer un article</span>
          <span class="sm:hidden">Créer</span>
        </button>

        <!-- Mes articles toggle -->
        <button v-if="isAuthenticated" @click="showMyArticles = !showMyArticles"
          :class="showMyArticles ? 'bg-white/15 text-white border-white/30' : 'bg-transparent text-gray-400 border-white/10'"
          class="px-4 sm:px-5 py-2 border font-bold uppercase text-[11px] tracking-[0.15em] rounded-full hover:border-white/30 hover:text-white transition-all flex items-center shrink-0 gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="hidden sm:inline">Mes articles</span>
          <span class="sm:hidden">Mes</span>
          <span v-if="myPendingCount > 0" class="ml-1 px-1.5 py-0.5 bg-yellow-500/80 text-black text-[10px] font-bold rounded-full">{{ myPendingCount }}</span>
        </button>
      </div>
    </div>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toastMessage"
        class="fixed top-24 right-4 z-50 px-5 py-3 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-2xl"
        :class="toastType === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'">
        <svg v-if="toastType === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- ===== MES ARTICLES ===== -->
    <div v-if="showMyArticles" class="mb-10">
      <h2 class="text-2xl font-bold mb-4 text-white">Mes articles</h2>

      <div v-if="myPending" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/40"></div>
      </div>

      <div v-else-if="!myArticles.length" class="text-center py-12 text-gray-500">
        <p>Vous n'avez pas encore publié d'article.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="article in myArticles" :key="article.id"
          class="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">

          <!-- Cover thumbnail -->
          <div class="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            <img v-if="article.images && article.images.length > 0" :src="(article.images as string[])[0]" :alt="article.title" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-white font-semibold text-sm truncate">{{ article.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ article.category }} · {{ formatDate(article.createdAt) }}</p>
            <!-- Rejection reason -->
            <p v-if="article.status === 'rejected' && article.rejectionReason" class="text-xs text-red-400 mt-1 italic">
              Raison : {{ article.rejectionReason }}
            </p>
          </div>

          <!-- Status badge -->
          <div class="shrink-0">
            <span v-if="article.status === 'published'"
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
              Publié
            </span>
            <span v-else-if="article.status === 'pending'"
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              En attente
            </span>
            <span v-else-if="article.status === 'rejected'"
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
              Refusé
            </span>
            <span v-else
              class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
              {{ article.status }}
            </span>
          </div>

          <!-- Link for published articles -->
          <NuxtLink v-if="article.status === 'published'" :to="'/Blog/' + article.id"
            class="shrink-0 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            Voir
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- ===== ARTICLES PUBLICS ===== -->
    <template v-if="!showMyArticles">
      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20 text-red-400">
        <p>Une erreur est survenue lors du chargement des articles.</p>
        <button @click="refresh()" class="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
          Réessayer
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!articles.length" class="text-center py-20 text-gray-400">
        <p class="text-xl">Aucun article trouvé matching vos critères.</p>
      </div>

      <!-- Articles Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink v-for="article in articles" :key="article.id" :to="'/Blog/' + article.id"
          class="group relative rounded-[24px] overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] block cursor-pointer backdrop-blur-md"
          style="background: rgba(255,255,255,0.08);">

          <!-- Cover Image -->
          <div class="relative h-48 overflow-hidden">
            <img v-if="article.images && article.images.length > 0" :src="article.images[0]" :alt="article.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div v-else
              class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-900/60">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <!-- Category badge overlay -->
            <div class="absolute top-3 left-3">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/20">
                {{ article.category }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[11px] text-gray-300 font-mono">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
              <span v-if="article.author" class="text-gray-500">·</span>
              <span v-if="article.author" class="text-[11px] text-gray-300 truncate">
                {{ article.author.firstName }} {{ article.author.lastName }}
              </span>
            </div>

            <h2 class="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors mb-2">
              {{ article.title }}
            </h2>
            <p class="text-sm text-gray-300 line-clamp-2 leading-relaxed">{{ article.content }}</p>

            <div class="flex items-center justify-end mt-4 pt-3 border-t border-white/10">
              <span class="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
                Lire l'article
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="mt-12 flex justify-center gap-2">
        <button @click="page--" :disabled="!pagination.hasPrev"
          class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Précédent
        </button>

        <span class="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
          Page {{ pagination.page }} sur {{ pagination.totalPages }}
        </span>

        <button @click="page++" :disabled="!pagination.hasNext"
          class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Suivant
        </button>
      </div>
    </template>

    <!-- Create Article Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7);" @click.self="isCreateModalOpen = false">
          <div class="w-full max-w-2xl rounded-[24px] overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
            style="background: #111;">

            <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 class="text-xl font-bold text-white">Créer un nouvel article</h3>
              <button @click="isCreateModalOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400">
                ✕
              </button>
            </div>

            <div class="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">
              <div class="space-y-6">
                <!-- Info banner -->
                <div class="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Votre article sera soumis à validation avant d'être publié.
                </div>

                <!-- Image Upload -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Image de couverture</label>
                  <FileUpload @update:file="f => articleImage = f" />
                </div>

                <!-- Title -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Titre <span
                      class="text-red-500">*</span></label>
                  <input v-model="articleForm.title" type="text" placeholder="Titre de l'article"
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Catégorie <span
                      class="text-red-500">*</span></label>
                  <select v-model="articleForm.category"
                    class="w-full px-4 py-3 bg-[#161616] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition appearance-none">
                    <option value="" disabled>Sélectionner une catégorie</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>

                <!-- Content -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Contenu <span
                      class="text-red-500">*</span></label>
                  <textarea v-model="articleForm.content" rows="8" placeholder="Rédigez votre article ici..."
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none"></textarea>
                </div>

              </div>
            </div>

            <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button @click="isCreateModalOpen = false"
                class="px-6 py-2.5 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Annuler
              </button>
              <button @click="submitArticle" :disabled="isSubmitting"
                class="px-6 py-2.5 rounded-full font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <span v-if="isSubmitting"
                  class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Soumettre l'article
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import FileUpload from '~/components/ui/FileUpload.vue';
import { useAuth } from '~/composables/useAuth';

const { isAuthenticated, token } = useAuth();

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  author: User | null;
  validatedBy: User | null;
  validatedAt: string | null;
  linkTo: string | null;
  hasImage: boolean;
  images: string[] | null;
}

interface MyArticle {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  publishedAt: string | null;
  images: any;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    articles: Article[];
    pagination: Pagination;
  };
}

// State
const page = ref(1);
const limit = ref(9);
const search = ref('');
const selectedCategory = ref('');
const showMyArticles = ref(false);

// Toast
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => { toastMessage.value = ''; }, 4000);
};

// Categories available based on seed data
const categories = [
  'Technology', 'Health', 'Science', 'Lifestyle',
  'Education', 'Work', 'Travel', 'Food', 'Art'
];

// Debounce search update
const debouncedSearch = ref('');
let searchTimeout: NodeJS.Timeout;

watch(search, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    page.value = 1;
  }, 300);
});

watch(selectedCategory, () => {
  page.value = 1;
});

// Modal state & logic
const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);
const articleImage = ref<File | null>(null);
const articleForm = ref({
  title: '',
  content: '',
  category: ''
});

const submitArticle = async () => {
  if (!articleForm.value.title || !articleForm.value.content || !articleForm.value.category) {
    showToast("Veuillez remplir tous les champs obligatoires.", 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('title', articleForm.value.title);
    formData.append('content', articleForm.value.content);
    formData.append('category', articleForm.value.category);
    formData.append('status', 'pending');

    if (articleImage.value) {
      formData.append('image', articleImage.value);
    }

    const { useAuth } = await import('~/composables/useAuth');
    const { token } = useAuth();

    const res = await $fetch<{ success: boolean }>('/api/articles', {
      method: 'POST',
      body: formData,
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    });

    if (res.success) {
      isCreateModalOpen.value = false;
      articleForm.value = { title: '', content: '', category: '' };
      articleImage.value = null;
      showToast("Article soumis avec succès ! Il sera publié après validation par un RP/Admin.", 'success');
      await refreshMyArticles();
    }
  } catch (e: any) {
    console.error('Erreur de création:', e);
    const msg = e.data?.data?.[0]?.message || e.data?.statusMessage || "Erreur lors de la création de l'article.";
    showToast("Erreur: " + msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch public articles
const { data, pending, error, refresh } = await useFetch<ApiResponse>('/api/articles', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value,
    category: selectedCategory.value || undefined,
    status: 'published'
  })),
  watch: [page, limit, debouncedSearch, selectedCategory]
});

const articles = computed(() => data.value?.data?.articles || []);
const pagination = computed(() => data.value?.data?.pagination || {
  page: 1, limit: 9, total: 0, totalPages: 0, hasNext: false, hasPrev: false
});

// Fetch user's own articles
const { data: myData, pending: myPending, refresh: refreshMyArticles } = useFetch<{ success: boolean; data: { articles: MyArticle[] } }>('/api/articles/mine', {
  headers: computed(() => token.value ? { Authorization: `Bearer ${token.value}` } : {} as HeadersInit),
  server: false,
  immediate: computed(() => isAuthenticated.value) as any,
  watch: [isAuthenticated]
});

const myArticles = computed<MyArticle[]>(() => myData.value?.data?.articles || []);
const myPendingCount = computed(() => myArticles.value.filter(a => a.status === 'pending').length);

// Utilities
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>

<style scoped>
/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .rounded-\[24px\],
.modal-leave-active .rounded-\[24px\] {
  transition: transform 0.3s ease;
}

.modal-enter-from .rounded-\[24px\],
.modal-leave-to .rounded-\[24px\] {
  transform: scale(0.95);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>