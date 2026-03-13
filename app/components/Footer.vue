<template>
    <footer class="w-full p-8 text-center text-secondary-400 text-sm font-sans mt-auto border-t border-secondary-800">
        <div class="flex flex-col items-center gap-4">
            <p>&copy; {{ new Date().getFullYear() }} IntraLab. All rights reserved.</p>
            <div class="flex gap-4">
                <NuxtLink to="/mentions-legales" class="hover:text-primary-400 transition-colors">Mentions légales</NuxtLink>
                <NuxtLink to="/confidentialite" class="hover:text-primary-400 transition-colors">Confidentialité</NuxtLink>
                <NuxtLink to="/contact" class="hover:text-primary-400 transition-colors">Contact</NuxtLink>
            </div>
        </div>
    </footer>
</template>
