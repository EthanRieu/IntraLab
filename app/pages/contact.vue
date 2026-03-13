<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">

    <!-- Hero -->
    <div class="mb-10">
      <h1 class="text-5xl font-bold text-white uppercase mb-2">CONTACT.</h1>
      <p class="text-gray-400 text-lg">Une question ou un problème ? Nous sommes disponibles.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <!-- Email -->
      <NuxtLink href="mailto:t.pierson@myskolae.fr"
        class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(120,80,255,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-purple-500/20 text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Par e-mail</p>
        <p class="text-xs text-gray-300 mt-1 mb-4">Envoyez-nous un message directement par e-mail.</p>
        <span class="text-sm text-purple-400 group-hover:text-purple-300 transition-colors font-medium flex items-center gap-2">
          t.pierson@myskolae.fr
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </NuxtLink>

      <!-- Messagerie interne -->
      <NuxtLink to="/Messages"
        class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(52,211,153,0.8), transparent 70%);"></div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-green-500/20 text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white uppercase tracking-wide">Via la messagerie</p>
        <p class="text-xs text-gray-300 mt-1 mb-4">Connectez-vous et envoyez un message directement via la plateforme.</p>
        <span class="text-sm text-green-400 group-hover:text-green-300 transition-colors font-medium flex items-center gap-2">
          Ouvrir la messagerie
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </NuxtLink>

    </div>

    <div class="mt-8">
      <NuxtLink to="/" class="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </NuxtLink>
    </div>

  </div>
</template>
