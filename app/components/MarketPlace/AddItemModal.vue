<script setup lang="ts">
import { ref } from 'vue';
import GlassSurface from '~/components/ui/GlassSurface.vue';
import FileUpload from '~/components/ui/FileUpload.vue';

const emit = defineEmits<{
    (e: 'close'): void,
    (e: 'item-added'): void
}>();

const name = ref('');
const category = ref('');
const condition = ref('');
const price = ref<number | null>(null);
const brand = ref('');
const description = ref('');
const selectedImage = ref<File | null>(null);

const loading = ref(false);
const error = ref('');

const categories = [
    'Nano-ordinateur',
    'Composant',
    'Périphérique',
    'Livre',
    'Électronique',
    'Autre'
];

const conditions = [
    { value: 'neuf', label: 'Neuf' },
    { value: 'tres_bon', label: 'Très bon état' },
    { value: 'bon', label: 'Bon état' },
    { value: 'correct', label: 'Usagé' },
    { value: 'abime', label: 'Pour pièces' }
];

const handleImageUpdate = (file: File | null) => {
    selectedImage.value = file;
};

const handleSubmit = async () => {
    if (!name.value || !category.value || !price.value) {
        error.value = "Veuillez remplir au moins le nom, la catégorie et le prix.";
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        const formData = new FormData();
        formData.append('name', name.value);
        formData.append('category', category.value);
        formData.append('condition', condition.value);
        formData.append('price', price.value.toString());
        formData.append('brand', brand.value);
        formData.append('description', description.value);

        if (selectedImage.value) {
            formData.append('image', selectedImage.value);
        }

        // Récupération manuelle du cookie vu qu'on utilise FormData (fetch.ts ne marchera pas naturellement sur un FormData brut pour le header parfois)
        const token = useCookie('auth_token').value;

        const response = await $fetch('/api/store/add', {
            method: 'POST',
            body: formData,
            headers: {
                // Nuxt $fetch gère déjà l'attachement du header depuis le plugin fetch.ts
            }
        });

        emit('item-added');
        emit('close');
    } catch (e: any) {
        console.error("Erreur lors de l'ajout", e);
        error.value = e.data?.statusMessage || e.statusMessage || "Une erreur s'est produite lors de l'ajout de votre article.";
    } finally {
        loading.value = false;
    }
};

</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop Blur -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

        <!-- Modal Content -->
        <div class="relative w-full max-w-2xl max-h-[90vh] flex flex-col pt-4 pb-4">
            <div
                class="bg-[#0b0c10] border border-white/10 rounded-[20px] shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden">

                <div class="px-8 py-6 flex justify-between items-center border-b border-white/10 shrink-0">
                    <h2 class="text-xl font-bold text-white uppercase tracking-wider">Mettre un article en vente</h2>
                    <button @click="emit('close')" class="text-white hover:text-red-400 transition cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="px-8 py-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    <form id="add-item-form" @submit.prevent="handleSubmit" class="flex flex-col gap-6 w-full">

                        <div v-if="error"
                            class="bg-red-500/10 text-red-400 text-sm font-medium text-center px-4 py-3 rounded-xl border border-red-500/20 backdrop-blur-md">
                            {{ error }}
                        </div>

                        <!-- Ligne 1: Nom et Prix -->
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="flex-1">
                                <label
                                    class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Nom
                                    de l'article *</label>
                                <input v-model="name" type="text" required placeholder="Ex: Flipper Zero"
                                    class="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                            </div>
                            <div class="w-full md:w-1/3">
                                <label
                                    class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Prix
                                    (€) *</label>
                                <input v-model="price" type="number" step="0.01" required placeholder="150.00"
                                    class="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                            </div>
                        </div>

                        <!-- Ligne 2: Catégorie et Condition -->
                        <div class="flex flex-col md:flex-row gap-4 relative z-20">
                            <div class="relative flex-1">
                                <label
                                    class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Catégorie
                                    *</label>
                                <select v-model="category" required
                                    class="appearance-none w-full px-5 py-3.5 bg-[#101115]/80 border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-all text-sm cursor-pointer shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                    <option value="">Sélectionner</option>
                                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                                </select>
                                <svg class="absolute right-4 top-[38px] w-4 h-4 text-gray-400 pointer-events-none"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                            <div class="relative flex-1">
                                <label
                                    class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">État</label>
                                <select v-model="condition"
                                    class="appearance-none w-full px-5 py-3.5 bg-[#101115]/80 border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-all text-sm cursor-pointer shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                    <option value="">Sélectionner</option>
                                    <option v-for="c in conditions" :key="c.value" :value="c.value">{{ c.label }}
                                    </option>
                                </select>
                                <svg class="absolute right-4 top-[38px] w-4 h-4 text-gray-400 pointer-events-none"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>

                        <!-- Ligne 3: Marque -->
                        <div>
                            <label
                                class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Marque
                                (Optionnel)</label>
                            <input v-model="brand" type="text" placeholder="Ex: Raspberry Pi"
                                class="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                        </div>

                        <!-- Ligne 4: Description -->
                        <div>
                            <label
                                class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Description</label>
                            <textarea v-model="description" rows="3" placeholder="Décrivez votre article..."
                                class="w-full px-5 py-3 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-all text-sm resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></textarea>
                        </div>

                        <!-- File Upload -->
                        <div>
                            <label
                                class="block text-[11px] font-bold text-gray-100 uppercase tracking-widest mb-2">Photo
                                de l'article</label>
                            <FileUpload @update:file="handleImageUpdate" />
                        </div>
                    </form>
                </div>

                <!-- Actions -->
                <div class="px-8 py-5 border-t border-white/10 shrink-0 flex justify-end gap-3 bg-black/20">
                    <button type="button" @click="emit('close')"
                        class="px-5 py-2.5 rounded-full text-white text-[11px] font-extrabold uppercase tracking-widest hover:bg-white/10 transition">
                        Annuler
                    </button>
                    <button type="submit" form="add-item-form" :disabled="loading"
                        class="px-8 py-2.5 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center min-w-[140px]">
                        <span v-if="loading"
                            class="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                        <span v-else>Publier</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
}
</style>
