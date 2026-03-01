<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import GlassSurface from '~/components/ui/GlassSurface.vue';

const { login } = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  loading.value = true;
  errorMessage.value = '';

  const authResult = await login(email.value, password.value);

  if (!authResult.success) {
    errorMessage.value = authResult.error || 'Identifiants invalides';
  }

  loading.value = false;
};
</script>

<template>
  <div class="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center relative -mt-10 overflow-hidden">

    <!-- Ambient Backlight -->
    <div
      class="absolute w-[80vw] md:w-[600px] h-[80vw] md:h-[600px] bg-[#222E42]/10 blur-[150px] rounded-full z-0 pointer-events-none">
    </div>

    <!-- Main Login Container (The Floating Module) -->
    <div class="w-full max-w-[420px] relative z-10 px-4">

      <GlassSurface :border-radius="20" :opacity="0.25" :border-width="0.08" :brightness="60" :blur="24" width="100%"
        height="auto" class="px-8 pt-10 pb-12">
        <form @submit.prevent="handleLogin" class="flex flex-col w-full relative h-full">

          <!-- Erreur message -->
          <div v-if="errorMessage"
            class="mb-6 w-full bg-red-500/10 text-red-400 text-[11px] font-medium text-center px-4 py-3 rounded-xl border border-red-500/20 backdrop-blur-md">
            {{ errorMessage }}
          </div>

          <!-- Email Input -->
          <div class="mb-8 relative">
            <label class="block text-[11px] font-bold text-gray-100 uppercase tracking-[0.15em] mb-2 drop-shadow-md">
              Adresse Email
            </label>
            <input v-model="email" type="email" required placeholder="john.doe@ges.fr"
              class="w-full px-5 py-3.5 bg-[#101115]/90 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#15171d]/90 transition-all font-medium text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
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
            <NuxtLink to="/Auth/signUp"
              class="text-[11px] text-gray-400 hover:text-white transition-colors tracking-wider font-medium hover:underline underline-offset-4 decoration-gray-500">
              Créer un compte
            </NuxtLink>

            <button type="submit" :disabled="loading"
              class="px-8 py-2.5 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]">
              <span v-if="loading" class="flex items-center gap-2">
                <span class="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
              </span>
              <span v-else>Connexion</span>
            </button>

            <!-- Small decorative blur behind button -->
            <div class="absolute right-0 -bottom-2 w-24 h-12 bg-white/20 blur-xl -z-10 rounded-full"></div>
          </div>
        </form>
      </GlassSurface>
    </div>
  </div>
</template>