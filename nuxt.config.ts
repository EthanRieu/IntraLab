import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    // '@prisma/nuxt' // Temporairement désactivé pour test
  ],
  typescript: {
    typeCheck: false,
  },
});
