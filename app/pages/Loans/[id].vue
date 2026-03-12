<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6 flex items-center">
      <NuxtLink to="/Loans"
        class="inline-flex items-center text-gray-300 hover:text-white transition-colors border border-white/10 bg-white/5 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd" />
        </svg>
        Retour à l'inventaire
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-32">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !item"
      class="text-center py-20 bg-red-500/10 rounded-[30px] border border-red-500/20 max-w-2xl mx-auto backdrop-blur-sm">
      <p class="text-red-400 font-medium mb-4">Erreur: Impossible de charger l'article.</p>
      <NuxtLink to="/Loans"
        class="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors inline-block">
        Retour
      </NuxtLink>
    </div>

    <!-- Item Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

      <!-- Left Column: Image -->
      <div class="relative w-full overflow-visible">
        <div class="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square rounded-[30px] overflow-hidden shadow-2xl">
          <div class="absolute inset-0 rounded-[30px] transition-opacity duration-300 pointer-events-none opacity-80"
            :style="{ boxShadow: `0 0 80px 10px ${imageColor || 'rgba(255,255,255,0.1)'}` }">
          </div>

          <img v-if="itemImage" :src="itemImage" :alt="item.name" crossorigin="anonymous"
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

        <!-- Item Info Card -->
        <GlassSurface :border-radius="30" :opacity="0.53" :border-width="0.07" :brightness="50" :blur="11" width="100%"
          class="relative z-20 overflow-hidden">
          <div class="p-8 w-full">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
              <h1 class="text-3xl md:text-4xl font-bold text-white break-words w-full">{{ item.name }}</h1>
              <div
                class="font-bold px-4 py-2 rounded-xl border backdrop-blur-md whitespace-nowrap self-start"
                :class="item.quantityAvailable > 0
                  ? 'bg-green-500/20 text-green-200 border-green-500/20'
                  : 'bg-red-500/20 text-red-200 border-red-500/20'">
                {{ item.quantityAvailable }} / {{ item.quantity }}
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-6">
              <span v-if="item.category" class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                {{ item.category }}
              </span>
              <span v-if="item.location" class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                📍 {{ item.location }}
              </span>
            </div>

            <div class="w-full">
              <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
              <p class="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-line break-words w-full">
                {{ item.description || 'Aucune description fournie.' }}
              </p>
            </div>
          </div>
        </GlassSurface>

        <!-- Borrow Form Card -->
        <GlassSurface :border-radius="30" :opacity="0.3" :border-width="0.05" :brightness="50" :blur="11" width="100%"
          class="relative z-20 overflow-hidden">
          <div class="p-8 w-full">
            <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Demander un emprunt
            </h3>

            <div v-if="!isAuthenticated" class="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-xl">
              Vous devez être connecté pour faire une demande d'emprunt.
            </div>

            <div v-else-if="item.quantityAvailable === 0" class="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl">
              Article momentanément indisponible. Tous les exemplaires sont empruntés.
            </div>

            <form v-else @submit.prevent="submitLoanRequest" class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Du</label>
                  <input v-model="form.startDate" type="date" required :min="minDate"
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Au (max 9 mois)</label>
                  <input v-model="form.endDate" type="date" required :min="form.startDate || minDate" :max="maxDate"
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Quantité</label>
                <input v-model.number="form.quantity" type="number" min="1" :max="Math.min(10, item.quantityAvailable)"
                  required
                  class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Motif de l'emprunt <span class="text-red-500">*</span></label>
                <textarea v-model="form.reason" rows="3" required
                  placeholder="Expliquez pourquoi vous avez besoin de cet article..."
                  class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none"></textarea>
              </div>

              <button type="submit" :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50">
                <span v-if="isSubmitting" class="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                {{ isSubmitting ? 'Envoi...' : 'Réserver' }}
              </button>

              <p v-if="successMessage" class="text-green-400 text-center text-sm p-3 bg-green-500/10 rounded-lg">
                {{ successMessage }}
              </p>
              <p v-if="errorMessage" class="text-red-400 text-center text-sm p-3 bg-red-500/10 rounded-lg">
                {{ errorMessage }}
              </p>
            </form>
          </div>
        </GlassSurface>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { FastAverageColor } from 'fast-average-color';
import GlassSurface from '~/components/ui/GlassSurface.vue';

const route = useRoute();
const itemId = route.params.id as string;
const { isAuthenticated, token } = useAuth();

// Default Dates Format (YYYY-MM-DD)
const today = new Date();
const minDate = today.toISOString().split('T')[0];

const maxDateObj = new Date();
maxDateObj.setMonth(maxDateObj.getMonth() + 9);
const maxDate = maxDateObj.toISOString().split('T')[0];

// Fetch single inventory item (The inventory API endpoint doesn't natively support /id. Let's filter or fetch if it exists... Wait, we must check if /server/api/inventory/[id].get.ts exists. Let's assume we can fetch the list and pick or create the endpoint if missing.)
// Actually, looking at the previous directory listing, there's NO /api/inventory/[id].get.ts
// Wait, we can fetch from /api/inventory?search=... or create /api/inventory/[id].get.ts.
// Best approach: To be fast, let's create the endpoint or fetch the paginated list and filter locally. If the item is not on the first page, it fails. So we really need the endpoint.
// For now, I'll fetch `/api/inventory` limit 1000 and find it as a fallback, but no, let's fetch correctly. Wait, does `/api/inventory` allow fetching by ID? Prisma can. Let's use `useFetch` to a new endpoint `/api/inventory/${itemId}` which we will create shortly.
const { data, pending, error } = await useFetch<any>(`/api/inventory/${itemId}`);
const item = computed(() => data.value?.data?.item);

const itemImage = computed(() => {
  if (item.value?.imageUrl) return item.value.imageUrl;
  const name = (item.value?.name || '').toLowerCase();
  if (name.includes('flipper')) return 'https://images.unsplash.com/photo-1662908869151-244a56a6ec15?q=80&w=800&auto=format&fit=crop';
  if (name.includes('câble') || name.includes('cable')) return 'https://images.unsplash.com/photo-1544186450-9a28db9450a8?q=80&w=800&auto=format&fit=crop';
  if (name.includes('raspberry') || name.includes('pi')) return 'https://images.unsplash.com/photo-1631551608753-159654782cb9?q=80&w=800&auto=format&fit=crop';
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
    imageColor.value = 'rgba(255,255,255,0.2)';
  }
};

// Form state
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const form = ref({
  startDate: minDate,
  endDate: '',
  quantity: 1,
  reason: ''
});

const submitLoanRequest = async () => {
  if (!form.value.startDate || !form.value.endDate || !form.value.reason) return;

  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const formattedNotes = `Du ${form.value.startDate} au ${form.value.endDate} - Motif: ${form.value.reason}`;

    // Convert to ISO 8601 string for the backend API
    const returnDateIso = new Date(form.value.endDate).toISOString();

    const res = await $fetch<{ success: boolean; message: string }>('/api/loans', {
      method: 'POST',
      headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}) },
      body: {
        itemId: itemId,
        quantityRequested: form.value.quantity,
        notes: formattedNotes,
        expectedReturnDate: returnDateIso
      }
    });

    if (res.success) {
      successMessage.value = "Votre demande d'emprunt a été envoyée. Vous recevrez une notification lors de son approbation.";
      form.value.reason = '';
    }
  } catch (err: any) {
    const msg = err.data?.data?.[0]?.message || err.data?.statusMessage || err.message || "Erreur lors de la création.";
    errorMessage.value = msg;
  } finally {
    isSubmitting.value = false;
  }
};
</script>