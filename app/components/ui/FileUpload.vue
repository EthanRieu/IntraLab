<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
    (e: 'update:file', file: File | null): void
}>();

const isDragging = ref(false);
const previewUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0] as File;
        if (file) handleFile(file);
    }
};

const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0] as File;
        if (file) handleFile(file);
    }
};

const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        emit('update:file', file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    } else {
        alert("Veuillez sélectionner une image valide.");
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

const removeFile = (e: Event) => {
    e.stopPropagation();
    previewUrl.value = null;
    emit('update:file', null);
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};
</script>

<template>
    <div class="relative w-full border-2 border-dashed rounded-2xl p-6 transition-all duration-300 group cursor-pointer"
        :class="[
            isDragging ? 'border-white/50 bg-white/10' : 'border-white/10 bg-[#101115]/80 hover:border-white/20 hover:bg-[#15171d]/90',
            previewUrl ? 'border-none p-0 overflow-hidden' : ''
        ]" @dragenter="handleDragEnter" @dragover="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop"
        @click="triggerFileInput">
        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />

        <!-- Empty State -->
        <div v-if="!previewUrl" class="flex flex-col items-center justify-center space-y-4 text-center">
            <div class="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110"
                :class="{ 'animate-pulse bg-white/20': isDragging }">
                <svg xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 text-gray-400 group-hover:text-white transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            </div>
            <div>
                <p class="text-sm font-medium text-white mb-1">
                    <span class="text-gray-400">Glissez-déposez ici ou</span> cliquez pour parcourir
                </p>
                <p class="text-[11px] text-gray-500 uppercase tracking-widest">SVG, PNG, JPG, GIF (Max. 5MB)</p>
            </div>
        </div>

        <!-- Preview State -->
        <div v-else class="relative w-full aspect-video md:aspect-[4/3] group/preview">
            <img :src="previewUrl" alt="Preview" class="w-full h-full object-cover rounded-2xl" />

            <!-- Overlay -->
            <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-4 backdrop-blur-sm">
                <button @click="removeFile"
                    class="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40 hover:text-white transition-all transform hover:scale-110 backdrop-blur-md"
                    title="Supprimer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>

    </div>
</template>
