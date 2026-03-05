<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 class="text-6xl font-bold bg-clip-text text-white">
        EMPRUNTS.
      </h1>

      <div class="flex flex-row gap-4 items-center">
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

        <!-- Category/Filter Pill -->
        <div class="relative">
          <select v-model="selectedCategory"
            class="appearance-none pl-4 pr-10 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]">
            <option value="">Filtres</option>
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
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
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
      <p class="text-xl">Aucun article trouvé.</p>
    </div>

    <!-- Items Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center mt-12">
      <NuxtLink v-for="item in items" :key="item.id" :to="'/Loans/' + item.id"
        class="block group relative h-[383px] w-full max-w-[320px] rounded-[30px] overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-cyan-500/10 cursor-pointer"
        :style="getCardStyle(item.id)">

        <!-- Glow Behind Effect -->
        <div
          class="absolute inset-0 rounded-[30px] transition-opacity duration-300 pointer-events-none opacity-80 group-hover:opacity-100"
          :style="{ boxShadow: `0 0 60px 5px ${imageColors[item.id] || 'transparent'}` }"></div>

        <!-- Background Image or Fallback -->
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" crossorigin="anonymous"
          @load="extractColor($event, item.id)"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10 rounded-[30px]" />

        <!-- API Mock Data for missing images (based on name for the mockup match) -->
        <img v-else-if="item.name.toLowerCase().includes('flipper')"
          src="https://images.unsplash.com/photo-1662908869151-244a56a6ec15?q=80&w=600&auto=format&fit=crop"
          crossorigin="anonymous" @load="extractColor($event, item.id)"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10 rounded-[30px]" />
        <img v-else-if="item.name.toLowerCase().includes('câble') || item.name.toLowerCase().includes('cable')"
          src="https://images.unsplash.com/photo-1544186450-9a28db9450a8?q=80&w=600&auto=format&fit=crop"
          crossorigin="anonymous" @load="extractColor($event, item.id)"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10 rounded-[30px]" />
        <img v-else-if="item.name.toLowerCase().includes('raspberry') || item.name.toLowerCase().includes('pi')"
          src="https://images.unsplash.com/photo-1631551608753-159654782cb9?q=80&w=600&auto=format&fit=crop"
          crossorigin="anonymous" @load="extractColor($event, item.id)"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10 rounded-[30px]" />

        <div v-else
          class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center z-10 rounded-[30px]"
          @vue:mounted="setDefaultColor(item.id, '#ffffff')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Glass Overlay at bottom -->
        <div class="absolute bottom-2 left-2 right-2 h-auto z-20">
          <GlassSurface :border-radius="20" :opacity="0.53" :border-width="0.07" :brightness="50" :blur="11"
            :displace="0.5" :distortion-scale="0.5" :red-offset="0" :green-offset="0" :blue-offset="0"
            :background-opacity="0.1" mix-blend-mode="normal" width="100%" height="auto" class="overflow-hidden">
            <div class="p-4 w-full flex flex-col gap-1">
              <div class="flex justify-between items-start">
                <h2 class="text-base font-bold text-white leading-tight line-clamp-1 truncate pr-2 max-w-[70%]">
                  {{ item.name }}
                </h2>
                <span class="text-xs font-medium text-gray-200 whitespace-nowrap pt-[2px]">
                  Stock : {{ item.quantityAvailable }}
                </span>
              </div>

              <div class="flex justify-between items-end mt-1">
                <p class="text-gray-300 text-sm line-clamp-1 w-5/6 truncate">
                  {{ item.category || 'Non catégorisé' }}
                </p>
                <div class="bg-white/10 rounded-md p-1 backdrop-blur-sm self-end">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </GlassSurface>
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-16 flex justify-center gap-2">
      <button @click="page--" :disabled="!pagination.hasPrev"
        class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-white">
        Précédent
      </button>

      <span class="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10">
        Page {{ pagination.page }} sur {{ pagination.totalPages }}
      </span>

      <button @click="page++" :disabled="!pagination.hasNext"
        class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-white">
        Suivant
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { FastAverageColor } from 'fast-average-color';
import GlassSurface from '~/components/ui/GlassSurface.vue';

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

// State
const page = ref(1);
const limit = ref(9);
const search = ref('');
const selectedCategory = ref('');

// Dominant Color State
const imageColors = ref<Record<string, string>>({});
const fac = new FastAverageColor();

const extractColor = async (event: Event, id: string) => {
  if (imageColors.value[id]) return;
  const imgElement = event.target as HTMLImageElement;
  try {
    const color = await fac.getColorAsync(imgElement);
    // Darken or saturate the color slightly if needed, or just use the hex
    imageColors.value[id] = color.hex;
  } catch (e) {
    console.error("Failed to extract color for", id, e);
    imageColors.value[id] = 'rgba(255,255,255,0.2)'; // Fallback faint white glow
  }
};

const setDefaultColor = (id: string, color: string) => {
  if (!imageColors.value[id]) {
    imageColors.value[id] = color;
  }
}

const getCardStyle = (id: string) => {
  return {
    '--card-glow': imageColors.value[id] || 'transparent'
  };
};

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