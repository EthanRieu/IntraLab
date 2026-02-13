<template>
    <div class="flex flex-col min-h-screen bg-custom-gradient text-white">
        <Header />
        <main class="flex-grow pt-24">
            <slot />
        </main>
        <Footer />
    </div>
</template>
