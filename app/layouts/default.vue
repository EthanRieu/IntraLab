<script setup>
import Dither from '~/components/Dither/Dither.vue'
</script>

<style>
html,
body {
    background-color: #1A1A1A;
}
</style>

<template>
    <div class="relative flex flex-col min-h-screen text-white" style="background-color: #1A1A1A;">
        <Dither
            class="fixed inset-0 z-0 h-screen w-screen"
            :wave-speed="0.03"
            :wave-frequency="1.5"
            :wave-amplitude="0.1"
            :wave-color="[1, 1, 1]"
            :color-num="10"
            :pixel-size="1"
            :disable-animation="false"
            :enable-mouse-interaction="false"
            :mouse-radius="1"
        />
        <div class="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main class="flex-grow pt-[80px]">
                <slot />
            </main>
            <Footer />
        </div>
    </div>
</template>
