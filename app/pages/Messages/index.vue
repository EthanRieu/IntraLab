<template>
    <div class="flex-1 flex flex-col items-center justify-center h-full text-gray-500 bg-[#0b0c10] p-8 text-center"
        style="height: 100%; min-height: 400px;">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mb-6 text-white/5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-xl font-medium text-white/80">Vos messages</p>
        <p class="text-sm mt-2 text-gray-400">Sélectionnez une conversation pour afficher les messages.</p>
    </div>
</template>

<script setup lang="ts">
// Empty state for /Messages route when no chat is selected.
</script>
