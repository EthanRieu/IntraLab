<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col gap-4">
      <h1 class="text-4xl sm:text-6xl font-bold">EMPRUNTS.</h1>

      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- Search Pill -->
        <div class="relative flex-1 sm:flex-none">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input v-model="search" type="text" placeholder="Rechercher un équipement"
            class="w-full sm:w-64 md:w-80 pl-10 pr-4 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]" />
        </div>

        <!-- Category/Filter Pill -->
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

        <!-- Add Button -->
        <button v-if="canManageInventory" @click="isCreateModalOpen = true"
          class="ml-auto px-4 sm:px-5 py-2 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Ajouter un équipement</span>
          <span class="sm:hidden">Ajouter</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Not authenticated State -->
    <div v-else-if="!token" class="text-center py-20 text-gray-300">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p class="text-xl font-semibold text-white mb-2">Connexion requise</p>
      <p class="text-gray-400 mb-6">Vous devez être connecté pour accéder à l'inventaire des emprunts.</p>
      <NuxtLink to="/Auth/signIn"
        class="inline-block px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition">
        Se connecter
      </NuxtLink>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20 text-red-400">
      <p>Une erreur est survenue lors du chargement de l'inventaire.</p>
      <button @click="refresh()" class="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
        Réessayer
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!items.length" class="text-center py-20 text-gray-400">
      <p class="text-xl">Aucun équipement trouvé.</p>
    </div>

    <!-- Items Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink v-for="item in items" :key="item.id" :to="'/Loans/' + item.id"
        class="group relative rounded-[24px] overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] block cursor-pointer backdrop-blur-md"
        style="background: rgba(255,255,255,0.08);">

        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <img v-else-if="item.name.toLowerCase().includes('flipper')"
            src="https://images.unsplash.com/photo-1662908869151-244a56a6ec15?q=80&w=600&auto=format&fit=crop"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <img v-else-if="item.name.toLowerCase().includes('câble') || item.name.toLowerCase().includes('cable')"
            src="https://images.unsplash.com/photo-1544186450-9a28db9450a8?q=80&w=600&auto=format&fit=crop"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <img v-else-if="item.name.toLowerCase().includes('raspberry') || item.name.toLowerCase().includes('pi')"
            src="https://images.unsplash.com/photo-1631551608753-159654782cb9?q=80&w=600&auto=format&fit=crop"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div v-else
            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-900/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Category badge overlay -->
          <div class="absolute top-3 left-3">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/20">
              {{ item.category || 'Non catégorisé' }}
            </span>
          </div>
          <!-- Stock badge -->
          <div class="absolute top-3 right-3">
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20"
              :class="item.quantityAvailable > 0 ? 'text-green-400' : 'text-red-400'">
              {{ item.quantityAvailable > 0 ? `${item.quantityAvailable} dispo.` : 'Indisponible' }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5">
          <h2 class="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors mb-2">
            {{ item.name }}
          </h2>
          <p class="text-sm text-gray-300 line-clamp-2 leading-relaxed">{{ item.description }}</p>

          <div class="flex items-center justify-end mt-4 pt-3 border-t border-white/10">
            <span class="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
              Voir l'équipement
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

    <!-- Create Item Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7);" @click.self="isCreateModalOpen = false">
          <div class="w-full max-w-2xl rounded-[24px] overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
            style="background: #111;">

            <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 class="text-xl font-bold text-white">Ajouter un équipement</h3>
              <button @click="isCreateModalOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400">
                ✕
              </button>
            </div>

            <div class="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">
              <div class="space-y-6">

                <!-- Image Upload -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Image</label>
                  <FileUpload @update:file="f => itemImage = f" />
                </div>

                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Nom <span class="text-red-500">*</span></label>
                  <input v-model="itemForm.name" type="text" placeholder="Nom de l'équipement"
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea v-model="itemForm.description" rows="3" placeholder="Description de l'équipement..."
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none"></textarea>
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Catégorie</label>
                  <input v-model="itemForm.category" type="text" placeholder="Ex: Électronique, Câble, Outil..."
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                </div>

                <!-- Quantity row -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Quantité totale <span class="text-red-500">*</span></label>
                    <input v-model.number="itemForm.quantity" type="number" min="0" placeholder="0"
                      class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Quantité disponible</label>
                    <input v-model.number="itemForm.quantityAvailable" type="number" min="0" :placeholder="String(itemForm.quantity || 0)"
                      class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                    <p class="text-[11px] text-gray-600 mt-1">Par défaut égale à la quantité totale</p>
                  </div>
                </div>

                <!-- Location -->
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Emplacement</label>
                  <input v-model="itemForm.location" type="text" placeholder="Ex: Salle 101, Armoire A3..."
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition">
                </div>

              </div>
            </div>

            <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button @click="isCreateModalOpen = false"
                class="px-6 py-2.5 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Annuler
              </button>
              <button @click="submitItem" :disabled="isSubmitting"
                class="px-6 py-2.5 rounded-full font-bold bg-white hover:bg-gray-200 text-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <span v-if="isSubmitting"
                  class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Ajouter l'équipement
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import FileUpload from '~/components/ui/FileUpload.vue';

const { token } = useAuth();

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  quantityAvailable: number;
  location: string;
  active: boolean;
  imageUrl?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterCategory {
  name: string;
  count: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    items: InventoryItem[];
    pagination: Pagination;
    filters: {
      categories: FilterCategory[];
    };
  };
}

// Decode JWT to get role (client-side, no secret needed for UI gating)
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

const canManageInventory = computed(() =>
  ['rp', 'admin'].includes(getRoleFromToken(token.value) ?? '')
);

// State
const page = ref(1);
const limit = ref(9);
const search = ref('');
const selectedCategory = ref('');

// Modal state
const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);
const itemImage = ref<File | null>(null);
const itemForm = ref({
  name: '',
  description: '',
  category: '',
  quantity: 0,
  quantityAvailable: undefined as number | undefined,
  location: ''
});

const submitItem = async () => {
  if (!itemForm.value.name || itemForm.value.quantity == null) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('name', itemForm.value.name);
    formData.append('quantity', String(itemForm.value.quantity));
    if (itemForm.value.description) formData.append('description', itemForm.value.description);
    if (itemForm.value.category) formData.append('category', itemForm.value.category);
    if (itemForm.value.quantityAvailable !== undefined) formData.append('quantityAvailable', String(itemForm.value.quantityAvailable));
    if (itemForm.value.location) formData.append('location', itemForm.value.location);
    if (itemImage.value) formData.append('image', itemImage.value);

    const res = await $fetch<{ success: boolean }>('/api/inventory', {
      method: 'POST',
      body: formData,
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    });

    if (res.success) {
      isCreateModalOpen.value = false;
      itemForm.value = { name: '', description: '', category: '', quantity: 0, quantityAvailable: undefined, location: '' };
      itemImage.value = null;
      await refresh();
    }
  } catch (e: any) {
    console.error('Erreur de création:', e);
    const msg = e.data?.data?.[0]?.message || e.data?.statusMessage || "Erreur lors de la création de l'équipement.";
    alert('Erreur: ' + msg);
  } finally {
    isSubmitting.value = false;
  }
};

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

// Fetch data
const { data, pending, error, refresh } = await useFetch<ApiResponse>('/api/inventory', {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value,
    category: selectedCategory.value || undefined
  })),
  watch: [page, limit, debouncedSearch, selectedCategory]
});

const items = computed(() => data.value?.data?.items || []);
const pagination = computed(() => data.value?.data?.pagination || {
  page: 1, limit: 9, total: 0, totalPages: 0, hasNext: false, hasPrev: false
});
const categories = computed(() => data.value?.data?.filters?.categories?.map(c => c.name) || []);
</script>

<style scoped>
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
