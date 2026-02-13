<template>
    <div class="fixed top-8 left-0 right-0 z-50 flex justify-center px-4 w-full">
        <header
            class="rounded-full px-8 py-3 flex items-center justify-between gap-12 max-w-5xl w-full md:w-auto relative liquid-glass">
            <!-- Logo -->
            <NuxtLink to="/" class="text-xl font-bold font-mono tracking-wide text-white">IntraLab</NuxtLink>

            <!-- Navigation -->
            <nav class="hidden md:flex gap-8 items-center font-sans text-sm font-medium text-gray-400">
                <NuxtLink to="/" exact-active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">
                    Accueil</NuxtLink>
                <NuxtLink to="/blog" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">Blog</NuxtLink>
                <NuxtLink to="/loans" active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">
                    Emprunts</NuxtLink>
                <NuxtLink to="/marketplace"
                    active-class="text-white font-bold underline underline-offset-8 decoration-2"
                    class="hover:text-white transition-colors">Marketplace</NuxtLink>
            </nav>

            <!-- CTA Button -->
            <NuxtLink to="/dashboard"
                class="px-6 py-2 bg-white text-black font-extrabold rounded-full hover:bg-gray-200 transition-colors text-sm tracking-wide">
                Dashboard
            </NuxtLink>
        </header>
    </div>
</template>

<style scoped>
/* Optional: smoother active link transition if needed */
</style>
