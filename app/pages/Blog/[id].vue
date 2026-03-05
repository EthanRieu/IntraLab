<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Back Button -->
    <NuxtLink to="/Blog/blog"
      class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 group">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:-translate-x-1 transition"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Retour au blog
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20 text-red-400">
      <p class="text-xl">Erreur: Impossible de charger l'article.</p>
      <NuxtLink to="/Blog/blog"
        class="mt-4 inline-block px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white">
        Retourner au blog
      </NuxtLink>
    </div>

    <!-- Article Content -->
    <div v-else-if="article">
      <!-- Hero Section -->
      <div class="relative w-full h-[400px] rounded-[32px] overflow-hidden mb-12 shadow-2xl">
        <!-- Image -->
        <img v-if="article.images && article.images.length > 0" :src="article.images[0]" :alt="article.title"
          class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-white/10" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent"></div>

        <!-- Title & Meta -->
        <div class="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <span v-if="article.category"
            class="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-blue-500/30">
            {{ article.category }}
          </span>
          <h1 class="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 shadow-black/50 drop-shadow-lg">
            {{ article.title }}
          </h1>
          <div class="flex items-center gap-4 text-gray-300 text-sm">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden border border-white/20">
                <span v-if="article.author" class="text-xs">
                  {{ article.author.firstName[0] }}{{ article.author.lastName[0] }}
                </span>
                <span v-else>?</span>
              </div>
              <span v-if="article.author" class="font-medium text-white">
                {{ article.author.firstName }} {{ article.author.lastName }}
              </span>
              <span v-else class="font-medium">Auteur inconnu</span>
            </div>
            <span class="text-white/20">•</span>
            <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Main Text Content -->
      <article class="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-6">
        <p v-for="(paragraph, index) in formattedContent" :key="index" class="mb-4">
          {{ paragraph }}
        </p>
      </article>

      <!-- Footer/Tags Area (Optional) -->
      <div class="mt-16 pt-8 border-t border-white/10 flex items-center justify-between text-gray-500 text-sm">
        <p>Publié le {{ formatDate(article.publishedAt || article.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const route = useRoute();
const articleId = route.params.id as string;

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  author: User | null;
  images: string[] | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    article: Article;
  };
}

// Fetch article data using the updated API
const { data, pending, error } = await useFetch<ApiResponse>(`/api/articles/${articleId}`);

const article = computed(() => data.value?.data?.article);

// Format text content slightly to handle line breaks natively
const formattedContent = computed(() => {
  if (!article.value?.content) return [];
  return article.value.content.split('\n').filter(p => p.trim() !== '');
});

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>