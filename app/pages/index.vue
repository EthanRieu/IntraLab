<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">

    <!-- Hero -->
    <div class="mb-12">
      <h1 class="text-6xl font-bold text-white uppercase mb-2">INTRALAB.</h1>
      <p class="text-gray-400 text-lg">Bienvenue sur votre espace collaboratif.</p>
    </div>

    <!-- Quick Nav Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      <NuxtLink to="/Dashboard"
        class="group relative rounded-[20px] p-5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
        style="background: rgba(255,255,255,0.03);">
        <div class="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-10 blur-3xl"
          style="background: radial-gradient(circle, rgba(120,80,255,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-500/15 text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Dashboard</p>
        <p class="text-xs text-gray-500 mt-0.5">Profil & activité</p>
      </NuxtLink>

      <NuxtLink to="/Loans"
        class="group relative rounded-[20px] p-5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
        style="background: rgba(255,255,255,0.03);">
        <div class="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-10 blur-3xl"
          style="background: radial-gradient(circle, rgba(251,191,36,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-500/15 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Emprunts</p>
        <p class="text-xs text-gray-500 mt-0.5">Inventaire lab</p>
      </NuxtLink>

      <NuxtLink to="/MarketPlace"
        class="group relative rounded-[20px] p-5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
        style="background: rgba(255,255,255,0.03);">
        <div class="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-10 blur-3xl"
          style="background: radial-gradient(circle, rgba(34,211,238,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-cyan-500/15 text-cyan-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Marketplace</p>
        <p class="text-xs text-gray-500 mt-0.5">Acheter & vendre</p>
      </NuxtLink>

      <NuxtLink to="/Blog/blog"
        class="group relative rounded-[20px] p-5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
        style="background: rgba(255,255,255,0.03);">
        <div class="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-10 blur-3xl"
          style="background: radial-gradient(circle, rgba(96,165,250,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-500/15 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Blog</p>
        <p class="text-xs text-gray-500 mt-0.5">Articles & actus</p>
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-32">
      <div class="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-white/60"></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <!-- ===== COL LEFT (2/3) ===== -->
        <div class="xl:col-span-2 space-y-8">

          <!-- Latest Blog Articles -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                Derniers articles
              </h2>
              <NuxtLink to="/Blog/blog" class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                Voir tout
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>

            <div v-if="!latestArticles.length" class="rounded-[20px] p-8 text-center text-gray-500 border border-white/5"
              style="background: rgba(255,255,255,0.02);">
              Aucun article publié pour le moment.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink v-for="article in latestArticles" :key="article.id" :to="`/Blog/${article.id}`"
                class="group relative rounded-[20px] overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
                style="background: rgba(255,255,255,0.03);">
                <div class="h-32 overflow-hidden relative">
                  <img v-if="article.images && article.images.length > 0" :src="article.images[0]" :alt="article.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-indigo-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div class="p-4">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-[10px] font-semibold uppercase tracking-wide text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {{ article.category }}
                    </span>
                    <span class="text-[10px] text-gray-600">{{ formatDate(article.publishedAt) }}</span>
                  </div>
                  <h3 class="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {{ article.title }}
                  </h3>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ article.content }}</p>
                </div>
              </NuxtLink>
            </div>
          </section>

          <!-- Marketplace Latest -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
                Marketplace — Nouvelles annonces
              </h2>
              <NuxtLink to="/MarketPlace" class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                Voir tout
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>

            <div v-if="!latestListings.length" class="rounded-[20px] p-8 text-center text-gray-500 border border-white/5"
              style="background: rgba(255,255,255,0.02);">
              Aucune annonce disponible.
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <NuxtLink v-for="listing in latestListings" :key="listing.id" :to="`/MarketPlace/${listing.id}`"
                class="group relative rounded-[20px] overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
                style="background: rgba(255,255,255,0.03);">
                <div class="h-28 overflow-hidden relative">
                  <img v-if="getListingImage(listing)" :src="getListingImage(listing)" :alt="listing.mainItem?.name"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="p-3">
                  <p class="text-xs font-semibold text-white truncate">{{ listing.mainItem?.name ?? 'Annonce' }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-[10px] text-gray-500">{{ listing.mainItem?.category ?? '' }}</span>
                    <span v-if="listing.mainItem?.price" class="text-xs font-bold text-white">
                      {{ listing.mainItem.price.toFixed(2) }} €
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </section>
        </div>

        <!-- ===== COL RIGHT (1/3) ===== -->
        <div class="space-y-8">

          <!-- Available Loans -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                Emprunts disponibles
              </h2>
              <NuxtLink to="/Loans" class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                Voir tout
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>

            <div class="rounded-[20px] overflow-hidden border border-white/8" style="background: rgba(255,255,255,0.02);">
              <div v-if="!latestItems.length" class="p-8 text-center text-gray-500">
                Aucun article disponible.
              </div>
              <ul v-else class="divide-y divide-white/5">
                <li v-for="item in latestItems" :key="item.id">
                  <NuxtLink :to="`/Loans/${item.id}`"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-white truncate">{{ item.name }}</p>
                      <p class="text-xs text-gray-500">{{ item.category }}</p>
                    </div>
                    <span class="text-xs text-gray-400 shrink-0">x{{ item.quantityAvailable }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </section>

          <!-- Messages CTA -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                Messagerie
              </h2>
            </div>
            <NuxtLink to="/Messages"
              class="group flex items-center gap-4 rounded-[20px] p-5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
              style="background: rgba(255,255,255,0.03);">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white">Vos conversations</p>
                <p class="text-xs text-gray-500 mt-0.5">Accéder à la messagerie</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600 group-hover:text-white transition-colors shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NuxtLink>
          </section>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  images?: string[] | null;
}

interface StoreItemSummary {
  name: string;
  price: number;
  category?: string | null;
  images?: any;
}

interface Listing {
  id: string;
  status: string;
  createdAt: string;
  mainItem: StoreItemSummary | null;
  itemCount: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantityAvailable: number;
}

// Fetch articles
const { data: articlesData, pending: pendingArticles } = await useFetch<any>('/api/articles', {
  query: { page: 1, limit: 4, status: 'published' }
});

// Fetch marketplace
const { data: storeData, pending: pendingStore } = await useFetch<any>('/api/store', {
  query: { page: 1, limit: 4 }
});

// Fetch inventory
const { data: inventoryData, pending: pendingInventory } = await useFetch<any>('/api/inventory', {
  query: { page: 1, limit: 6 }
});

const pending = computed(() => pendingArticles.value || pendingStore.value || pendingInventory.value);

const latestArticles = computed<Article[]>(() => articlesData.value?.data?.articles ?? []);
const latestListings = computed<Listing[]>(() => storeData.value?.data?.listings ?? []);
const latestItems = computed<InventoryItem[]>(() => inventoryData.value?.data?.items ?? []);

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getListingImage = (listing: Listing): string | undefined => {
  if (listing.mainItem?.images && Array.isArray(listing.mainItem.images) && listing.mainItem.images.length > 0) {
    return listing.mainItem.images[0];
  }
  return undefined;
};
</script>

<style scoped>
.bg-white\/3 {
  background: rgba(255, 255, 255, 0.03);
}

.border-white\/8 {
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
