<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6 flex items-center">
      <NuxtLink to="/MarketPlace"
        class="inline-flex items-center text-gray-300 hover:text-white transition-colors border border-white/10 bg-white/5 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd" />
        </svg>
        Retour à la Marketplace
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-32">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error"
      class="text-center py-20 bg-red-500/10 rounded-[30px] border border-red-500/20 max-w-2xl mx-auto backdrop-blur-sm">
      <p class="text-red-400 font-medium mb-4">Une erreur est survenue lors du chargement de l'annonce.</p>
      <NuxtLink to="/MarketPlace"
        class="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors inline-block">
        Retour
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else-if="listing" class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Left Column: Image -->
      <div class="relative w-full overflow-visible">
        <div
          class="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square rounded-[30px] overflow-hidden shadow-2xl">
          <div class="absolute inset-0 rounded-[30px] transition-opacity duration-300 pointer-events-none opacity-80"
            :style="{ boxShadow: `0 0 80px 10px ${imageColor || 'rgba(255,255,255,0.1)'}` }">
          </div>

          <img v-if="listingImage" :src="listingImage" :alt="listing.item.name" crossorigin="anonymous"
            @load="extractColor" class="absolute inset-0 w-full h-full object-cover z-10 rounded-[30px]" />
          <div v-else
            class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center z-10 rounded-[30px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-white/20" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Right Column: Details -->
      <div class="flex flex-col gap-6">
        <!-- Item Info -->
        <GlassSurface :border-radius="30" :opacity="0.53" :border-width="0.07" :brightness="50" :blur="11" width="100%"
          class="relative z-20 overflow-hidden">
          <div class="p-8 w-full">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
              <h1 class="text-3xl md:text-4xl font-bold text-white break-words w-full">{{ listing.item.name }}</h1>
              <div
                class="bg-blue-500/20 text-blue-200 font-bold px-4 py-2 rounded-xl border border-blue-500/20 backdrop-blur-md whitespace-nowrap self-start">
                {{ listing.item.price }} €
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-6">
              <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                {{ listing.item.category }}
              </span>
              <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                État : {{ listing.item.conditionLabel }}
              </span>
              <span v-if="listing.item.brand"
                class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                Marque : {{ listing.item.brand }}
              </span>
            </div>

            <div class="mb-2 w-full">
              <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
              <p class="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-line break-words w-full">
                {{ listing.item.description || 'Aucune description fournie.' }}
              </p>
            </div>
          </div>
        </GlassSurface>

        <!-- Seller Info -->
        <GlassSurface :border-radius="30" :opacity="0.3" :border-width="0.05" :brightness="50" :blur="11" width="100%"
          class="relative z-20 overflow-hidden">
          <div class="p-8 w-full">
            <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations du Vendeur
            </h3>

            <div class="flex flex-col gap-3">
              <div class="flex items-center text-white">
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-lg font-bold mr-4 shrink-0">
                  {{ listing.seller.firstName.charAt(0) }}{{ listing.seller.lastName.charAt(0) }}
                </div>
                <div class="break-words w-full">
                  <div class="font-bold text-lg leading-tight">{{ listing.seller.firstName }} {{ listing.seller.lastName
                    }}</div>
                  <div v-if="listing.seller.className" class="text-sm text-gray-400">{{ listing.seller.className }}
                    (Niveau {{ listing.seller.classLevel }})</div>
                </div>
              </div>

              <div class="h-px w-full bg-white/10 my-2"></div>

              <div class="flex flex-col gap-2">
                <a :href="`mailto:${listing.seller.email}`"
                  class="flex items-center text-gray-300 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/5 break-all w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-gray-400 shrink-0" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{{ listing.seller.email }}</span>
                </a>

                <a v-if="listing.seller.phone" :href="`tel:${listing.seller.phone}`"
                  class="flex items-center text-gray-300 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/5 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-gray-400 shrink-0" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{{ listing.seller.phone }}</span>
                </a>
              </div>

              <!-- Chat Button -->
              <ClientOnly>
                <div class="mt-4"
                  v-if="currentUserId && listing?.seller?.id && String(listing.seller.id) !== String(currentUserId)">
                  <button @click="startChat(listing.seller.id)" :disabled="isStartingChat"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50">
                    <div v-if="isStartingChat"
                      class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white">
                    </div>
                    <template v-else>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contacter via la messagerie
                    </template>
                  </button>
                </div>
              </ClientOnly>

            </div>
          </div>
        </GlassSurface>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { FastAverageColor } from 'fast-average-color';
import GlassSurface from '~/components/ui/GlassSurface.vue';

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  className: string | null;
  classLevel: number | null;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  condition: string | null;
  conditionLabel: string;
  price: number;
  brand: string | null;
  images: string[] | null;
}

interface ListingDetails {
  id: string;
  status: string | null;
  createdAt: string | Date | null;
  seller: Seller;
  item: Item;
}

interface ApiResponse {
  success: boolean;
  data: ListingDetails;
}

const route = useRoute();
const id = route.params.id as string;

const { data, pending, error } = await useFetch<ApiResponse>(`/api/store/${id}`);

const listing = computed(() => data.value?.data);

const listingImage = computed(() => {
  if (listing.value?.item?.images && Array.isArray(listing.value.item.images) && listing.value.item.images.length > 0) {
    return listing.value.item.images[0];
  }

  // Mocks based on the index.vue to keep it consistent 
  const name = (listing.value?.item?.name || '').toLowerCase();
  if (name.includes('flipper')) return "https://images.unsplash.com/photo-1662908869151-244a56a6ec15?q=80&w=600&auto=format&fit=crop";
  if (name.includes('câble') || name.includes('cable')) return "https://images.unsplash.com/photo-1544186450-9a28db9450a8?q=80&w=600&auto=format&fit=crop";
  if (name.includes('raspberry') || name.includes('pi')) return "https://images.unsplash.com/photo-1631551608753-159654782cb9?q=80&w=600&auto=format&fit=crop";

  return undefined;
});

const imageColor = ref<string>('');
const fac = new FastAverageColor();

const extractColor = async (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  try {
    const color = await fac.getColorAsync(imgElement);
    imageColor.value = color.hex;
  } catch (e) {
    console.error("Failed to extract color", e);
    imageColor.value = 'rgba(255,255,255,0.2)';
  }
};

const authToken = useCookie<string>('auth_token');
const currentUserId = computed(() => {
  if (!authToken.value) return null;
  try {
    const payload = authToken.value.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.userId;
  } catch (e) {
    return null;
  }
});
const isStartingChat = ref(false);

const startChat = async (sellerId: string) => {
  if (isStartingChat.value) return;
  isStartingChat.value = true;

  try {
    const { data: response } = await useFetch('/api/chat/start', {
      method: 'POST',
      body: { targetUserId: sellerId }
    });

    if (response.value?.success && response.value?.data?.sessionId) {
      const router = useRouter();
      const message = `Bonjour, je suis intéressé(e) par votre annonce "${listing.value?.item?.name}".`;
      router.push(`/Messages/${response.value.data.sessionId}?msg=${encodeURIComponent(message)}`);
    } else {
      alert("Une erreur est survenue lors de la création de la discussion.");
    }
  } catch (e) {
    console.error(e);
    alert("Impossible de contacter le vendeur pour le moment.");
  } finally {
    isStartingChat.value = false;
  }
};
</script>