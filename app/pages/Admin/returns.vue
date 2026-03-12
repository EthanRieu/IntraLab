<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-6xl font-bold bg-clip-text">RETOURS.</h1>
        <p class="text-gray-500 text-sm mt-2">
          {{ approvedLoans.length }} item{{ approvedLoans.length !== 1 ? 's' : '' }} en cours d'emprunt
          <span v-if="overdueCount > 0" class="text-red-400 font-semibold ml-2">
            · {{ overdueCount }} en retard
          </span>
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-row gap-3 items-center flex-wrap">
        <div class="relative">
          <select v-model="filterOverdue"
            class="appearance-none pl-4 pr-10 py-2 bg-[#1a1a1a]/80 border border-white/10 rounded-full text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-[#1a1a1a]">
            <option value="all">Tous les emprunts</option>
            <option value="overdue">En retard uniquement</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button @click="refresh()"
          class="p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
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
      <p>Erreur lors du chargement des emprunts.</p>
      <button @click="refresh()" class="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-white text-sm">
        Réessayer
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredLoans.length" class="text-center py-20 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg">Aucun emprunt en cours.</p>
    </div>

    <!-- Loans list -->
    <div v-else class="space-y-3">
      <div v-for="loan in filteredLoans" :key="loan.id"
        class="group rounded-2xl border transition-all duration-200 overflow-hidden"
        :class="loan.isOverdue
          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15'">

        <div class="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4">

          <!-- Item info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {{ loan.item.category || 'Sans catégorie' }}
              </span>
              <span v-if="loan.isOverdue"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                EN RETARD
              </span>
            </div>
            <h3 class="text-white font-bold mt-1.5 text-base leading-tight">{{ loan.item.name }}</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ loan.item.location }}</p>
          </div>

          <!-- Borrower -->
          <div class="md:w-48 shrink-0">
            <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Emprunteur</p>
            <p class="text-sm font-semibold text-white">{{ loan.borrower.firstName }} {{ loan.borrower.lastName }}</p>
            <p v-if="loan.borrower.class" class="text-xs text-gray-500">{{ loan.borrower.class.name }}</p>
            <p class="text-xs text-gray-600 truncate">{{ loan.borrower.email }}</p>
          </div>

          <!-- Qty -->
          <div class="md:w-16 shrink-0 text-center">
            <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Qté</p>
            <p class="text-lg font-bold text-white">{{ loan.quantityApproved ?? loan.quantityRequested }}</p>
          </div>

          <!-- Dates -->
          <div class="md:w-36 shrink-0">
            <div class="space-y-1">
              <div>
                <p class="text-[10px] text-gray-600 uppercase tracking-wider">Emprunté le</p>
                <p class="text-xs text-gray-400">{{ formatDate(loan.loanDate ?? loan.createdAt) }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider" :class="loan.isOverdue ? 'text-red-500' : 'text-gray-600'">
                  À rendre le
                </p>
                <p class="text-xs font-semibold" :class="loan.isOverdue ? 'text-red-400' : 'text-white'">
                  {{ loan.expectedReturnDate ? formatDate(loan.expectedReturnDate) : '—' }}
                </p>
                <p v-if="loan.isOverdue && loan.expectedReturnDate" class="text-[11px] text-red-400/70">
                  {{ daysOverdue(loan.expectedReturnDate) }} j de retard
                </p>
              </div>
            </div>
          </div>

          <!-- Action button -->
          <div class="md:w-36 shrink-0 flex justify-end">
            <button @click="openReturnModal(loan)"
              class="px-4 py-2 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.12em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Rendu
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Return confirmation modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="returnModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.7);" @click.self="closeReturnModal">
        <div class="w-full max-w-md rounded-[24px] overflow-hidden border border-white/10"
          style="background: #111;">

          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 class="text-lg font-bold text-white">Confirmer le retour</h3>
            <button @click="closeReturnModal"
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400 text-lg">
              ✕
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <p class="text-sm font-bold text-white">{{ returnModal.loan?.item.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Emprunté par <span class="text-white font-semibold">{{ returnModal.loan?.borrower.firstName }} {{ returnModal.loan?.borrower.lastName }}</span>
              </p>
              <p v-if="returnModal.loan?.isOverdue" class="text-xs text-red-400 mt-1 font-semibold">
                Retour en retard de {{ returnModal.loan?.expectedReturnDate ? daysOverdue(returnModal.loan.expectedReturnDate) : '?' }} jour(s)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Notes (optionnel)</label>
              <textarea v-model="returnModal.notes" rows="3"
                placeholder="État de l'équipement, remarques..."
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition resize-none text-sm"></textarea>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button @click="closeReturnModal"
              class="px-5 py-2 rounded-full font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
              Annuler
            </button>
            <button @click="confirmReturn" :disabled="returnModal.loading"
              class="px-5 py-2 rounded-full font-bold bg-white hover:bg-gray-200 text-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
              <span v-if="returnModal.loading"
                class="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"></span>
              Confirmer le retour
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

interface Loan {
  id: string;
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    class: { slug: string; name: string; level: number } | null;
  };
  item: { id: string; name: string; category: string; location: string };
  quantityRequested: number;
  quantityApproved: number | null;
  status: string;
  createdAt: string;
  loanDate: string | null;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  isOverdue: boolean;
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

const filterOverdue = ref<'all' | 'overdue'>('all');

const { data, pending, error, refresh } = await useFetch<any>('/api/loans', {
  query: { status: 'approved', limit: 200 },
  headers: computed(() => token.value ? { Authorization: `Bearer ${token.value}` } : {} as HeadersInit),
  server: false,
});

const approvedLoans = computed<Loan[]>(() => {
  const loans: Loan[] = data.value?.data?.loans ?? [];
  return [...loans].sort((a, b) => {
    if (!a.expectedReturnDate && !b.expectedReturnDate) return 0;
    if (!a.expectedReturnDate) return 1;
    if (!b.expectedReturnDate) return -1;
    return new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime();
  });
});

const filteredLoans = computed(() => {
  if (filterOverdue.value === 'overdue') return approvedLoans.value.filter(l => l.isOverdue);
  return approvedLoans.value;
});

const overdueCount = computed(() => approvedLoans.value.filter(l => l.isOverdue).length);

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysOverdue = (dateStr: string) => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

// Return modal
const returnModal = ref<{
  open: boolean;
  loan: Loan | null;
  notes: string;
  loading: boolean;
}>({ open: false, loan: null, notes: '', loading: false });

const openReturnModal = (loan: Loan) => {
  returnModal.value = { open: true, loan, notes: '', loading: false };
};

const closeReturnModal = () => {
  if (returnModal.value.loading) return;
  returnModal.value.open = false;
};

const confirmReturn = async () => {
  if (!returnModal.value.loan) return;
  returnModal.value.loading = true;
  try {
    await $fetch(`/api/loans/${returnModal.value.loan.id}`, {
      method: 'PUT',
      body: {
        action: 'return',
        actualReturnDate: new Date().toISOString(),
        notes: returnModal.value.notes || undefined,
      },
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    returnModal.value.open = false;
    await refresh();
  } catch (e: any) {
    const msg = e.data?.statusMessage || 'Erreur lors du traitement du retour.';
    alert('Erreur: ' + msg);
  } finally {
    returnModal.value.loading = false;
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
