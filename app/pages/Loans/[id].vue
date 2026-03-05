<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Back Button -->
    <NuxtLink to="/Loans" class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 group">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:-translate-x-1 transition"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Retour à l'inventaire
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !item" class="text-center py-20 text-red-400">
      <p class="text-xl">Erreur: Impossible de charger l'article.</p>
    </div>

    <!-- Item Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-12">

      <!-- Left side: Image -->
      <div class="relative w-full h-[400px] md:h-full min-h-[400px] rounded-[32px] overflow-hidden shadow-2xl">
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover" />
        <img v-else-if="item.name.toLowerCase().includes('flipper')"
          src="https://images.unsplash.com/photo-1662908869151-244a56a6ec15?q=80&w=800&auto=format&fit=crop"
          class="w-full h-full object-cover" />
        <img v-else-if="item.name.toLowerCase().includes('câble') || item.name.toLowerCase().includes('cable')"
          src="https://images.unsplash.com/photo-1544186450-9a28db9450a8?q=80&w=800&auto=format&fit=crop"
          class="w-full h-full object-cover" />
        <img v-else-if="item.name.toLowerCase().includes('raspberry') || item.name.toLowerCase().includes('pi')"
          src="https://images.unsplash.com/photo-1631551608753-159654782cb9?q=80&w=800&auto=format&fit=crop"
          class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-white/10" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Right side: Info and Form -->
      <div class="flex flex-col justify-center">
        <div class="mb-4">
          <span v-if="item.category"
            class="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-purple-500/30">
            {{ item.category }}
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-2">
            {{ item.name }}
          </h1>
          <p class="text-gray-400 text-lg">
            Emplacement : <span class="text-white">{{ item.location || 'Non spécifié' }}</span>
          </p>
        </div>

        <p class="text-gray-300 mb-8 leading-relaxed">
          {{ item.description || "Aucune description fournie pour cet article." }}
        </p>

        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <span class="text-gray-400 font-medium">Stock disponible</span>
          <span class="text-3xl font-bold font-mono"
            :class="item.quantityAvailable > 0 ? 'text-green-400' : 'text-red-400'">
            {{ item.quantityAvailable }} <span class="text-sm font-normal text-gray-500">/ {{ item.quantity }}</span>
          </span>
        </div>

        <div v-if="!isAuthenticated"
          class="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-xl">
          Vous devez être connecté pour faire une demande d'emprunt.
        </div>

        <div v-else-if="item.quantityAvailable === 0"
          class="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl">
          Article momentanément indisponible. Tous les exemplaires sont empruntés.
        </div>

        <!-- Borrow Form -->
        <form v-else @submit.prevent="submitLoanRequest"
          class="space-y-6 bg-[#161616] border border-white/10 p-6 rounded-3xl">
          <h3 class="text-xl font-bold text-white mb-4">Demander un emprunt</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Du</label>
              <input v-model="form.startDate" type="date" required :min="minDate"
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
            </div>

            <!-- Expected Return Date -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Au (max 9 mois)</label>
              <input v-model="form.endDate" type="date" required :min="form.startDate || minDate" :max="maxDate"
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
            </div>
          </div>

          <!-- Quantity Option (Defaults to 1, hidden or locked to max items available) -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Quantité</label>
            <input v-model.number="form.quantity" type="number" min="1" :max="Math.min(10, item.quantityAvailable)"
              required
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition">
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Motif de l'emprunt <span
                class="text-red-500">*</span></label>
            <textarea v-model="form.reason" rows="3" required
              placeholder="Expliquez pourquoi vous avez besoin de cet article..."
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none"></textarea>
          </div>

          <button type="submit" :disabled="isSubmitting"
            class="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="isSubmitting"
              class="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            {{ isSubmitting ? 'Envoi...' : 'Réserver' }}
          </button>

          <p v-if="successMessage" class="text-green-400 text-center text-sm mt-4 p-3 bg-green-500/10 rounded-lg">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="text-red-400 text-center text-sm mt-4 p-3 bg-red-500/10 rounded-lg">
            {{ errorMessage }}
          </p>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

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