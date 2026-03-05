<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 class="text-6xl font-bold bg-clip-text  ">
        BLOG.
      </h1>

      <div class="flex flex-row gap-4 items-center">
        <!-- Create Article Button -->
        <button v-if="isAuthenticated" @click="isCreateModalOpen = true"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition whitespace-nowrap shadow-lg shadow-blue-500/20">
          Créer un article
        </button>

        <!-- Search Pill -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input v-model="search" type="text" placeholder="Rechercher un article"
            class="w-64 md:w-80 pl-10 pr-4 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]" />
        </div>

        <!-- Category/Date Pill -->
        <div class="relative">
          <select v-model="selectedCategory"
            class="appearance-none pl-4 pr-10 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]">
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
      </div>
    </div>

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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
      <NuxtLink v-for="article in articles" :key="article.id" :to="'/Blog/' + article.id"
        class="group relative h-[383px] w-full max-w-[800px] rounded-[30px] overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-cyan-500/20 block cursor-pointer">

        <!-- Background Image -->
        <img v-if="article.images && article.images.length > 0" :src="article.images[0]" :alt="article.title"
          class="absolute inset-0 w-full h-full object-cover scale-110 transition-transform duration-700 group-hover:scale-120" />

        <!-- Fallback if no image -->
        <div v-else
          class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Glass Overlay at bottom -->
        <div class="absolute bottom-2 left-2 right-2 h-auto">
          <GlassSurface :border-radius="20" :opacity="0.53" :border-width="0.07" :brightness="50" :blur="11"
            :displace="0.5" :distortion-scale="0.5" :red-offset="0" :green-offset="0" :blue-offset="0"
            :background-opacity="0.1" mix-blend-mode="normal" width="100%" height="auto" class="overflow-hidden">
            <div class="p-4 w-full flex flex-col gap-1">
              <div class="flex justify-between items-start">
                <h2
                  class="text-lg font-bold text-white leading-tight line-clamp-2 pr-4 group-hover:text-blue-300 transition-colors">
                  {{ article.title }}
                </h2>
                <span class="text-xs font-mono text-gray-300 whitespace-nowrap pt-1">
                  {{ formatDate(article.publishedAt) }}
                </span>
              </div>

              <div class="flex justify-between items-end mt-2">
                <p class="text-gray-300 text-sm line-clamp-1 w-5/6">
                  {{ article.content }}
                </p>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </GlassSurface>
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
                Publier l'article
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import GlassSurface from '~/components/ui/GlassSurface.vue';
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
    page.value = 1; // Reset to first page on search
  }, 300);
});

watch(selectedCategory, () => {
  page.value = 1; // Reset to first page on category change
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
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('title', articleForm.value.title);
    formData.append('content', articleForm.value.content);
    formData.append('category', articleForm.value.category);
    // On met par défaut 'published' pour que l'utilisateur puisse le voir tout de suite dans cet exemple
    formData.append('status', 'published');

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
      await refresh();
    }
  } catch (e: any) {
    console.error('Erreur de création:', e);
    const msg = e.data?.data?.[0]?.message || e.data?.statusMessage || "Erreur lors de la création de l'article.";
    alert("Erreur: " + msg);
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch data
const { data, pending, error, refresh } = await useFetch<ApiResponse>('/api/articles', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value,
    category: selectedCategory.value || undefined,
    status: 'published' // Ensure we only get published articles by default
  })),
  watch: [page, limit, debouncedSearch, selectedCategory]
});

const articles = computed(() => data.value?.data?.articles || []);
const pagination = computed(() => data.value?.data?.pagination || {
  page: 1, limit: 9, total: 0, totalPages: 0, hasNext: false, hasPrev: false
});

// Utilities
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>

<style scoped>
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