<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-32">
      <div class="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-white/60"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-32 text-red-400">
      <p class="text-xl mb-4">Une erreur est survenue lors du chargement.</p>
      <button @click="refresh()"
        class="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white border border-white/10">
        Réessayer
      </button>
    </div>

    <template v-else-if="dashboardData">
      <!-- ===== HEADER / PROFILE ===== -->
      <div class="mb-12">
        <h1 class="text-6xl font-bold text-white uppercase mb-8">DASHBOARD.</h1>

        <div class="relative rounded-[28px] overflow-hidden p-6 md:p-8"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
          <!-- Subtle gradient accent -->
          <div class="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
            style="background: radial-gradient(circle, rgba(120,80,255,0.6), transparent 70%);">
          </div>

          <div class="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group/avatar"
                style="background: linear-gradient(135deg, rgba(120,80,255,0.5), rgba(60,140,255,0.3));"
                @click="avatarInputRef?.click()"
                :title="avatarUploading ? 'Upload en cours…' : 'Changer la photo de profil'">

                <!-- Photo or initials -->
                <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar"
                  class="absolute inset-0 w-full h-full object-cover" />
                <span v-else
                  class="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white/80 select-none">
                  {{ userInitials }}
                </span>

                <!-- Hover overlay -->
                <div
                  class="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200"
                  style="background: rgba(0,0,0,0.55);">
                  <!-- Spinner when uploading -->
                  <svg v-if="avatarUploading" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <!-- Pencil icon -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
                  </svg>
                  <span class="text-white text-[9px] font-semibold tracking-wide uppercase">Photo</span>
                </div>
              </div>

              <!-- Hidden file input -->
              <input ref="avatarInputRef" type="file" accept="image/*" class="hidden" @change="uploadAvatar" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl md:text-3xl font-bold text-white truncate">
                {{ dashboardData.user.firstName }} {{ dashboardData.user.lastName }}
              </h2>
              <p class="text-gray-400 text-sm mt-0.5">{{ dashboardData.user.email }}</p>

              <div class="flex flex-wrap gap-2 mt-3">
                <!-- Role badge -->
                <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  :style="roleBadgeStyle">
                  {{ dashboardData.user.role.name }}
                </span>
                <!-- Class badge -->
                <span v-if="dashboardData.user.class"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10">
                  {{ dashboardData.user.class.name }}
                  <!-- <span v-if="dashboardData.user.class.level" class="text-white/50 ml-1">·
                    {{ dashboardData.user.class.level }}</span> -->
                </span>
                <!-- Specialization badge -->
                <span v-if="dashboardData.user.specialization"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  {{ dashboardData.user.specialization.name }}
                </span>
                <!-- Phone -->
                <span v-if="dashboardData.user.phone"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10">
                  📱 {{ dashboardData.user.phone }}
                </span>
              </div>
            </div>

            <!-- Stats row -->
            <div class="flex gap-4 md:gap-6 shrink-0">
              <div class="text-center">
                <p class="text-2xl font-bold text-white">{{ dashboardData.activeLoans.length }}</p>
                <p class="text-xs text-gray-500 mt-0.5">Emprunts actifs</p>
              </div>
              <div class="w-px bg-white/10 self-stretch hidden md:block"></div>
              <div class="text-center">
                <p class="text-2xl font-bold text-white">{{ dashboardData.articles.length }}</p>
                <p class="text-xs text-gray-500 mt-0.5">Articles</p>
              </div>
              <div class="w-px bg-white/10 self-stretch hidden md:block"></div>
              <div class="text-center">
                <p class="text-2xl font-bold text-white">{{ dashboardData.listings.length }}</p>
                <p class="text-xs text-gray-500 mt-0.5">Annonces</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MAIN GRID ===== -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <!-- ===== PENDING LOAN REQUESTS (For RP/Admin) ===== -->
        <section v-if="isModerator && dashboardData.pendingRequests && dashboardData.pendingRequests.length > 0"
          class="xl:col-span-2 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
              Demandes d'emprunt à traiter
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="loan in dashboardData.pendingRequests" :key="loan.id"
              class="rounded-[20px] p-4 border border-yellow-500/30 bg-yellow-500/5 transition-all duration-200">

              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="text-sm font-semibold text-white leading-tight">
                  Demande pour: {{ loan.item.name }}
                </h3>
              </div>

              <div class="text-xs text-gray-400 mb-3 space-y-1">
                <p><span class="text-gray-500">Par :</span> {{ loan.borrower?.firstName }} {{ loan.borrower?.lastName }}
                  <span class="text-gray-500">({{ loan.borrower?.email }})</span></p>
                <p><span class="text-gray-500">Quantité demandée :</span> <span class="text-white">{{
                  loan.quantityRequested }}</span></p>
                <div v-if="loan.notes" class="mt-2 bg-black/40 p-2 rounded">
                  <span class="text-gray-500 italic">Notes/Motif :</span> {{ loan.notes }}
                </div>
              </div>

              <div class="flex gap-2">
                <button @click="processLoan(loan.id, 'approve', loan.quantityRequested)"
                  class="flex-1 py-2 text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition"
                  :disabled="isProcessing[loan.id]">
                  Approuver
                </button>
                <button @click="processLoan(loan.id, 'reject')"
                  class="flex-1 py-2 text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                  :disabled="isProcessing[loan.id]">
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== ACTIVE LOANS ===== -->
        <section class="xl:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              Mes emprunts en cours
            </h2>
            <NuxtLink to="/Loans" class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              Voir tout
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Empty -->
          <div v-if="!dashboardData.activeLoans.length"
            class="rounded-[20px] p-8 text-center text-gray-500 border border-white/5"
            style="background: rgba(255,255,255,0.02);">
            Aucun emprunt en cours.
          </div>

          <!-- Loans list -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="loan in dashboardData.activeLoans" :key="loan.id"
              class="rounded-[20px] p-4 border transition-all duration-200 hover:scale-[1.01]" :class="loan.isOverdue
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-white/8 bg-white/3'">

              <div class="flex items-start justify-between gap-2 mb-3">
                <h3 class="text-sm font-semibold text-white leading-tight line-clamp-2">
                  {{ loan.item.name }}
                </h3>
                <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  :class="loanStatusBadge(loan.status, loan.isOverdue)">
                  {{ loanStatusLabel(loan.status, loan.isOverdue) }}
                </span>
              </div>

              <p class="text-xs text-gray-500 mb-1">{{ loan.item.category }}</p>
              <p v-if="loan.item.location" class="text-xs text-gray-600">📍 {{ loan.item.location }}</p>

              <div class="mt-3 pt-3 border-t border-white/5 space-y-1">
                <div v-if="loan.loanDate" class="flex justify-between text-xs">
                  <span class="text-gray-500">Emprunté le</span>
                  <span class="text-gray-300">{{ formatDate(loan.loanDate) }}</span>
                </div>
                <div v-if="loan.expectedReturnDate" class="flex justify-between text-xs">
                  <span class="text-gray-500">À rendre le</span>
                  <span :class="loan.isOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'">
                    {{ formatDate(loan.expectedReturnDate) }}
                    <span v-if="loan.isOverdue" class="ml-1">⚠️</span>
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">Quantité</span>
                  <span class="text-gray-300">{{ loan.quantityApproved ?? loan.quantityRequested }}</span>
                </div>
                <div v-if="loan.notes" class="text-xs text-gray-400 mt-2 bg-white/5 p-2 rounded line-clamp-2">
                  <span class="text-gray-500 italic">Motif :</span> {{ loan.notes }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== LOAN HISTORY + ARTICLES side by side ===== -->

        <!-- Loan History -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
              Historique des emprunts
            </h2>
            <button v-if="dashboardData.loanHistory.length > 0" @click="showHistoryModal = true"
              class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              Tout voir ({{ dashboardData.loanHistory.length }})
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div class="rounded-[20px] overflow-hidden border border-white/8" style="background: rgba(255,255,255,0.02);">
            <div v-if="!dashboardData.loanHistory.length" class="p-8 text-center text-gray-500">
              Aucun historique.
            </div>
            <ul v-else class="divide-y divide-white/5">
              <li v-for="loan in dashboardData.loanHistory.slice(0, 5)" :key="loan.id"
                class="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition">
                <!-- Icon -->
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  :class="loan.status === 'returned' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'">
                  {{ loan.status === 'returned' ? '✓' : '✗' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ loan.item.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ loan.actualReturnDate ? `Rendu le ${formatDate(loan.actualReturnDate)}` :
                      formatDate(loan.updatedAt) }}
                  </p>
                </div>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                  :class="loan.status === 'returned' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'">
                  {{ loanStatusLabel(loan.status, false) }}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <!-- My Articles -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
              Mes articles
            </h2>
            <NuxtLink to="/Blog/blog" class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              Voir le blog
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NuxtLink>
          </div>

          <div class="rounded-[20px] overflow-hidden border border-white/8" style="background: rgba(255,255,255,0.02);">
            <div v-if="!dashboardData.articles.length" class="p-8 text-center text-gray-500">
              Vous n'avez pas encore publié d'article.
            </div>
            <ul v-else class="divide-y divide-white/5">
              <li v-for="article in dashboardData.articles.slice(0, 5)" :key="article.id"
                class="flex items-start gap-4 px-4 py-3 hover:bg-white/3 transition">
                <!-- Thumbnail or fallback -->
                <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                  <img v-if="article.images && article.images.length > 0" :src="article.images[0]" :alt="article.title"
                    class="w-full h-full object-cover" />
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white/20" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ article.title }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-gray-500">{{ article.category }}</span>
                    <span class="text-white/20">·</span>
                    <span class="text-xs text-gray-500">{{ formatDate(article.createdAt) }}</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                  :class="articleStatusBadge(article.status)">
                  {{ article.status }}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <!-- ===== MARKETPLACE LISTINGS ===== -->
        <section class="xl:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
              Mes annonces Marketplace
            </h2>
            <NuxtLink to="/MarketPlace"
              class="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              Voir le marketplace
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </NuxtLink>
          </div>

          <div v-if="!dashboardData.listings.length"
            class="rounded-[20px] p-8 text-center text-gray-500 border border-white/5"
            style="background: rgba(255,255,255,0.02);">
            Vous n'avez aucune annonce active.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <NuxtLink v-for="listing in dashboardData.listings" :key="listing.id" :to="`/MarketPlace/${listing.id}`"
              class="group relative rounded-[20px] overflow-hidden border border-white/8 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
              style="background: rgba(255,255,255,0.03);">

              <!-- Image or fallback -->
              <div class="h-36 overflow-hidden relative">
                <img v-if="getListingImage(listing)" :src="getListingImage(listing)" :alt="listing.mainItem?.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div v-else
                  class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white/15" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <!-- Status overlay -->
                <div class="absolute top-2 right-2">
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    :class="listingStatusBadge(listing.status)">
                    {{ listing.status === 'active' ? 'En vente' : listing.status }}
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="p-3">
                <h3 class="text-sm font-semibold text-white truncate">
                  {{ listing.mainItem?.name ?? 'Annonce' }}
                </h3>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-xs text-gray-500">{{ listing.mainItem?.category ?? 'N/A' }}</span>
                  <span v-if="listing.mainItem?.price" class="text-sm font-bold text-white">
                    {{ listing.mainItem.price.toFixed(2) }} €
                  </span>
                </div>
                <p class="text-[10px] text-gray-600 mt-1">
                  Mis en vente le {{ formatDate(listing.createdAt) }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>
    </template>

    <!-- ===== HISTORY MODAL ===== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7);" @click.self="showHistoryModal = false">
          <div class="w-full max-w-2xl rounded-[24px] overflow-hidden border border-white/10 max-h-[80vh] flex flex-col"
            style="background: #111;">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 class="text-lg font-bold text-white">Historique complet des emprunts</h3>
              <button @click="showHistoryModal = false"
                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition text-gray-400">
                ✕
              </button>
            </div>
            <!-- Modal body -->
            <div class="overflow-y-auto flex-1 px-6 py-4">
              <ul class="space-y-2">
                <li v-for="loan in dashboardData?.loanHistory" :key="loan.id"
                  class="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-white/10 transition"
                  style="background: rgba(255,255,255,0.02);">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                    :class="loan.status === 'returned' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'">
                    {{ loan.status === 'returned' ? '✓' : '✗' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">{{ loan.item.name }}</p>
                    <p class="text-xs text-gray-500">{{ loan.item.category }}</p>
                    <div class="flex gap-4 mt-1 text-xs text-gray-500">
                      <span v-if="loan.loanDate">Emprunté : {{ formatDate(loan.loanDate) }}</span>
                      <span v-if="loan.actualReturnDate">Rendu : {{ formatDate(loan.actualReturnDate) }}</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                    :class="loan.status === 'returned' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'">
                    {{ loanStatusLabel(loan.status, false) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

definePageMeta({ path: '/dashboard' });

// ---- Types ----
interface UserClass { id: string; slug: string; name: string; level?: string | null }
interface UserSpecialization { id: string; slug: string; name: string }
interface UserRole { id: string; slug: string; name: string }

interface LoanItem { id: string; name: string; category: string; location?: string }
interface Loan {
  id: string;
  item: LoanItem;
  quantityRequested: number;
  quantityApproved?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  loanDate?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  notes?: string | null;
  borrower?: { id: string; firstName: string; lastName: string; email: string };
  isOverdue: boolean;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  createdAt: string;
  publishedAt?: string | null;
  images?: string[] | null;
}

interface StoreItemSummary {
  name: string;
  price: number;
  category?: string | null;
  condition?: string | null;
  images?: any;
}

interface Listing {
  id: string;
  status: string;
  createdAt: string;
  mainItem: StoreItemSummary | null;
  itemCount: number;
}

interface DashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  role: UserRole;
  class?: UserClass | null;
  specialization?: UserSpecialization | null;
  stats: { activeLoans: number; unreadNotifications: number; activeListings: number };
}

interface DashboardData {
  user: DashboardUser;
  activeLoans: Loan[];
  pendingRequests?: Loan[];
  loanHistory: Loan[];
  articles: Article[];
  listings: Listing[];
}

interface ApiResponse {
  success: boolean;
  data: DashboardData;
}

// ---- State ----
const showHistoryModal = ref(false);

// ---- Avatar ----
const avatarUrl = ref<string | null>(null);
const avatarUploading = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  // Load persisted avatar from localStorage
  const stored = localStorage.getItem('user_avatar_url');
  if (stored) avatarUrl.value = stored;
});

const uploadAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length || !dashboardData.value) return;

  avatarUploading.value = true;
  try {
    const file = input.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);

    const { useAuth } = await import('~/composables/useAuth');
    const { token } = useAuth();

    const res = await $fetch<{ success: boolean; data: { avatarUrl: string } }>(
      `/api/users/${dashboardData.value.user.id}/avatar`,
      {
        method: 'POST',
        body: form,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      }
    );

    if (res.success) {
      avatarUrl.value = res.data.avatarUrl;
      localStorage.setItem('user_avatar_url', res.data.avatarUrl);
    }
  } catch (e) {
    console.error('Avatar upload failed:', e);
  } finally {
    avatarUploading.value = false;
    // Reset input so same file can be re-selected
    input.value = '';
  }
};

// ---- Fetch ----
// On SSR (hard reload), forward the cookie header so the server middleware can
// extract the auth_token. useRequestHeaders only runs server-side; on the client
// the fetch plugin already injects the Authorization header.
const { data, pending, error, refresh } = await useFetch<ApiResponse>('/api/dashboard', {
  headers: useRequestHeaders(['cookie']),
});

const dashboardData = computed(() => data.value?.data ?? null);

// ---- Computed ----
const userInitials = computed(() => {
  if (!dashboardData.value) return '?';
  const { firstName, lastName } = dashboardData.value.user;
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
});

const roleBadgeStyle = computed(() => {
  const role = dashboardData.value?.user.role.slug ?? '';
  if (role === 'rp') return 'background: rgba(255,215,0,0.15); color: #FFD700; border: 1px solid rgba(255,215,0,0.3)';
  if (role === 'admin') return 'background: rgba(255,100,100,0.15); color: #FF6464; border: 1px solid rgba(255,100,100,0.3)';
  return 'background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.15)';
});

// ---- Helpers ----
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const isModerator = computed(() => {
  const role = dashboardData.value?.user.role.slug;
  return role === 'admin' || role === 'rp';
});

const isProcessing = ref<Record<string, boolean>>({});

const processLoan = async (loanId: string, action: 'approve' | 'reject', qty?: number) => {
  let rejectionReason = '';
  if (action === 'reject') {
    const reason = prompt("Veuillez indiquer le motif du refus (minimum 10 caractères) :");
    if (!reason) return;
    if (reason.length < 10) {
      alert("La raison doit contenir au moins 10 caractères.");
      return;
    }
    rejectionReason = reason;
  }

  isProcessing.value[loanId] = true;
  try {
    const { useAuth } = await import('~/composables/useAuth');
    const { token } = useAuth();
    const res = await $fetch<{ success: boolean; message: string }>(`/api/loans/${loanId}`, {
      method: 'PUT',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: {
        action,
        ...(action === 'approve' ? { quantityApproved: qty } : { rejectionReason })
      }
    });

    if (res.success) {
      await refresh();
    }
  } catch (err: any) {
    alert(err.data?.statusMessage || "Erreur lors de l'opération.");
  } finally {
    isProcessing.value[loanId] = false;
  }
};

const loanStatusLabel = (status: string, isOverdue: boolean): string => {
  if (isOverdue) return 'En retard';
  const labels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    active: 'Actif',
    overdue: 'En retard',
    returned: 'Rendu',
    rejected: 'Refusé',
    cancelled: 'Annulé',
  };
  return labels[status] ?? status;
};

const loanStatusBadge = (status: string, isOverdue: boolean): string => {
  if (isOverdue || status === 'overdue') return 'bg-red-500/15 text-red-400';
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    approved: 'bg-blue-500/15 text-blue-300',
    active: 'bg-green-500/15 text-green-400',
    returned: 'bg-gray-500/15 text-gray-400',
    rejected: 'bg-red-500/15 text-red-400',
    cancelled: 'bg-gray-500/15 text-gray-500',
  };
  return map[status] ?? 'bg-white/10 text-white/50';
};

const articleStatusBadge = (status: string): string => {
  const map: Record<string, string> = {
    published: 'bg-green-500/15 text-green-400',
    draft: 'bg-gray-500/15 text-gray-400',
    pending: 'bg-yellow-500/15 text-yellow-400',
    rejected: 'bg-red-500/15 text-red-400',
  };
  return map[status] ?? 'bg-white/10 text-white/50';
};

const listingStatusBadge = (status: string): string => {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-300',
    sold: 'bg-gray-500/20 text-gray-400',
    pending: 'bg-yellow-500/20 text-yellow-300',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return map[status] ?? 'bg-white/10 text-white/50';
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

.bg-white\/8 {
  background: rgba(255, 255, 255, 0.08);
}

.border-white\/8 {
  border-color: rgba(255, 255, 255, 0.08);
}

/* Modal transition */
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
  transform: scale(0.95) translateY(10px);
}
</style>