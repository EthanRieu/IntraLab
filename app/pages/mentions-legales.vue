<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">

    <!-- Hero -->
    <div class="mb-10">
      <h1 class="text-5xl font-bold text-white uppercase mb-2">MENTIONS LÉGALES.</h1>
      <p class="text-gray-400 text-lg">Informations légales relatives à la plateforme IntraLab.</p>
    </div>

    <div class="space-y-4">

      <!-- Éditeur -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(120,80,255,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Éditeur du site</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          IntraLab est une plateforme interne développée dans le cadre d'un projet scolaire à l'ESGI (École Supérieure de Génie Informatique).
          Le site est utilisé exclusivement dans un cadre pédagogique.
        </p>
      </div>

      <!-- Responsable -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(251,191,36,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Responsable de la publication</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          Thomas Pierson<br />
          <a href="mailto:t.pierson@myskolae.fr" class="text-purple-400 hover:text-purple-300 transition-colors">
            t.pierson@myskolae.fr
          </a>
        </p>
      </div>

      <!-- Hébergement -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(34,211,238,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Hébergement</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          Ce site est hébergé dans le cadre d'une infrastructure dédiée au projet scolaire IntraLab.
        </p>
      </div>

      <!-- Propriété intellectuelle -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(96,165,250,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Propriété intellectuelle</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          L'ensemble des contenus présents sur ce site (textes, images, codes source) sont la propriété exclusive de leurs auteurs respectifs.
          Toute reproduction ou utilisation sans autorisation préalable est interdite.
        </p>
      </div>

      <!-- Limitation -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute bottom-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(52,211,153,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Limitation de responsabilité</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          IntraLab est un projet à vocation pédagogique. Les informations publiées sont fournies à titre indicatif.
          L'équipe ne saurait être tenue responsable des erreurs ou omissions pouvant y figurer.
        </p>
      </div>

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
