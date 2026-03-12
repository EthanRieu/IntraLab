<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import GlassSurface from '~/components/ui/GlassSurface.vue';

const { register } = useAuth();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const classId = ref('');
const specId = ref('');

const loading = ref(false);
const errorMessage = ref('');

// Dropdown data
const classes = ref<any[]>([]);
const specializations = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { classes: any[]; specializations: any[] } }>('/api/classes');
    if (res.data) {
      classes.value = res.data.classes;
      specializations.value = res.data.specializations;
    }
  } catch (e) {
    console.error('Failed to load form options', e);
  }
});

const handleRegister = async () => {
  if (!email.value || !password.value || !firstName.value || !lastName.value || !classId.value) return;

  loading.value = true;
  errorMessage.value = '';

  const userData = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    password: password.value,
    classId: classId.value,
    // Only attach specId if selected
    ...(specId.value ? { specId: specId.value } : {})
  };

  const authResult = await register(userData);

  if (!authResult.success) {
    errorMessage.value = authResult.error || 'Erreur lors de l\'inscription';
  }

  loading.value = false;
};
</script>

<template>
  <div class="min-h-[calc(100vh-100px)] flex flex-col relative -mt-10 overflow-hidden">

    <!-- Ambient Backlight -->
    <div
      class="absolute w-[80vw] md:w-[600px] h-[80vw] md:h-[600px] bg-[#222E42]/10 blur-[150px] rounded-full z-0 pointer-events-none">
    </div>

    <!-- Title -->
    <div class="relative z-10 px-6 md:px-24 pt-24 mb-8">
      <h1 class="text-6xl font-bold text-white uppercase">Créer un compte.</h1>
    </div>

    <!-- Main Login Container (The Floating Module) -->
    <div class="flex-1 flex items-center justify-center px-4 pb-8">
    <div class="w-full max-w-[460px] relative z-10">

      <GlassSurface :border-radius="20" :opacity="0.25" :border-width="0.08" :brightness="60" :blur="24" width="100%"
        height="auto" class="px-8 pt-10 pb-12">
        <form @submit.prevent="handleRegister" class="flex flex-col w-full relative h-full">

          <!-- Erreur message -->
          <div v-if="errorMessage"
            class="mb-6 w-full bg-red-500/10 text-red-400 text-[11px] font-medium text-center px-4 py-3 rounded-xl border border-red-500/20 backdrop-blur-md">
            {{ errorMessage }}
          </div>

          <!-- First/Last Name Row -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="relative w-full sm:w-1/2">
              <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
                Nom
              </label>
              <input v-model="lastName" type="text" required placeholder="Doe"
                class="w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div class="relative w-full sm:w-1/2">
              <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
                Prénom
              </label>
              <input v-model="firstName" type="text" required placeholder="John"
                class="w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
          </div>

          <!-- Email Input -->
          <div class="mb-6 relative">
            <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
              Adresse Email
            </label>
            <input v-model="email" type="email" required placeholder="john.doe@ges.fr"
              class="w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
          </div>

          <!-- Classe / Spécialisation Row -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6 relative z-20">
            <div class="relative w-full sm:w-1/2">
              <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
                Classe
              </label>
              <select v-model="classId" required
                class="appearance-none w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                <option value="" disabled selected>Sélectionner...</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <svg class="absolute right-4 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            <div class="relative w-full sm:w-1/2">
              <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
                Spé (Optionnel)
              </label>
              <select v-model="specId"
                class="appearance-none w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                <option value="">Aucune</option>
                <option v-for="s in specializations" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <svg class="absolute right-4 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          <!-- Password Input -->
          <div class="mb-4 relative">
            <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
              Mot de passe
            </label>
            <input v-model="password" type="password" required placeholder="••••••••"
              class="w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-lg tracking-[0.3em] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10" />
          </div>

          <!-- Submit Button / Action Area -->
          <div class="flex items-center justify-between mt-8 relative">
            <NuxtLink to="/Auth/signIn"
              class="text-[11px] text-gray-400 hover:text-white transition-colors tracking-wider font-medium hover:underline underline-offset-4 decoration-gray-500">
              Se connecter
            </NuxtLink>

            <button type="submit" :disabled="loading"
              class="px-8 py-2.5 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]">
              <span v-if="loading" class="flex items-center gap-2">
                <span class="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
              </span>
              <span v-else>S'inscrire</span>
            </button>

            <!-- Small decorative blur behind button -->
            <div class="absolute right-0 -bottom-2 w-24 h-12 bg-white/20 blur-xl -z-10 rounded-full"></div>
          </div>
        </form>
      </GlassSurface>
    </div>
    </div>
  </div>
</template>