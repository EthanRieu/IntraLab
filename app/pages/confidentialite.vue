<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">

    <!-- Hero -->
    <div class="mb-10">
      <h1 class="text-5xl font-bold text-white uppercase mb-2">CONFIDENTIALITÉ.</h1>
      <p class="text-gray-400 text-lg">Comment nous collectons et protégeons vos données.</p>
    </div>

    <div class="space-y-4">

      <!-- Collecte -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(120,80,255,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Collecte des données</h2>
        <p class="text-sm text-gray-300 leading-relaxed mb-3">
          Dans le cadre de l'utilisation d'IntraLab, nous collectons uniquement les données nécessaires au bon fonctionnement de la plateforme :
        </p>
        <ul class="space-y-1.5">
          <li v-for="item in collecte" :key="item" class="flex items-center gap-2 text-sm text-gray-300">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Utilisation -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(251,191,36,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Utilisation des données</h2>
        <p class="text-sm text-gray-300 leading-relaxed mb-3">Les données collectées sont utilisées exclusivement pour :</p>
        <ul class="space-y-1.5">
          <li v-for="item in utilisation" :key="item" class="flex items-center gap-2 text-sm text-gray-300">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Conservation -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(34,211,238,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Conservation des données</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          Vos données sont conservées pour la durée nécessaire à la fourniture des services proposés par IntraLab, dans le cadre du projet pédagogique.
          Elles ne sont en aucun cas transmises à des tiers.
        </p>
      </div>

      <!-- Sécurité -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(96,165,250,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Sécurité</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          Nous mettons en œuvre les mesures techniques appropriées pour protéger vos données contre tout accès non autorisé, altération ou divulgation.
        </p>
      </div>

      <!-- Droits RGPD -->
      <div class="group relative rounded-[20px] p-6 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md overflow-hidden"
        style="background: rgba(255,255,255,0.08);">
        <div class="absolute bottom-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl"
          style="background: radial-gradient(circle, rgba(52,211,153,0.8), transparent 70%);"></div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-3">Vos droits (RGPD)</h2>
        <p class="text-sm text-gray-300 leading-relaxed">
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
          Pour exercer ces droits, contactez-nous à :<br />
          <a href="mailto:t.pierson@myskolae.fr" class="text-purple-400 hover:text-purple-300 transition-colors mt-1 inline-block">
            t.pierson@myskolae.fr
          </a>
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

<script setup lang="ts">
const collecte = [
  'Nom et prénom',
  'Adresse e-mail',
  'Données liées à vos emprunts, annonces et messages',
]

const utilisation = [
  'Vous permettre d\'accéder à votre espace personnel',
  'Gérer vos emprunts de matériel',
  'Faciliter les échanges entre membres via la messagerie et la marketplace',
  'Vous informer via les articles du blog',
]
</script>
