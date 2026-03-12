<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isVisible = ref(true);
const isLeaving = ref(false);

onMounted(() => {
    // Check if splash has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

    if (hasSeenSplash) {
        isVisible.value = false;
        return;
    }

    // Set flag for future reloads in this session
    sessionStorage.setItem('hasSeenSplash', 'true');

    // Ensure minimum display time of 2.5 seconds
    setTimeout(() => {
        isLeaving.value = true;
        setTimeout(() => {
            isVisible.value = false;
        }, 800); // 800ms for the exit animation
    }, 2500);
});
</script>

<template>
    <Teleport to="body">
        <Transition name="splash">
            <div v-if="isVisible"
                class="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden"
                :class="{ 'opacity-0 pointer-events-none transition-opacity duration-800 ease-in-out': isLeaving }">

                <!-- Background Ambient Glow -->
                <div class="absolute inset-0 flex items-center justify-center opacity-30">
                    <div class="w-[40vw] h-[40vw] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse"></div>
                </div>

                <!-- Main Logo Animation -->
                <div class="relative z-10 flex flex-col items-center gap-8">
                    <!-- Glitch / Neon text effect -->
                    <div class="relative group cursor-default">
                        <h1
                            class="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-gradient-x logo-text">
                            INTRALAB
                        </h1>

                        <!-- Glowing outline -->
                        <h1 class="absolute inset-0 text-6xl md:text-8xl font-black tracking-tighter text-transparent logo-outline select-none"
                            aria-hidden="true" style="-webkit-text-stroke: 1px rgba(255,255,255,0.4);">
                            INTRALAB
                        </h1>

                        <!-- Neon Underglow -->
                        <div
                            class="absolute -inset-4 bg-white/20 blur-3xl rounded-full opacity-0 animate-glow-pulse -z-10">
                        </div>
                    </div>

                    <!-- Loading Bar -->
                    <div class="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
                        <div
                            class="absolute top-0 left-0 bottom-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-loading-bar rounded-full">
                        </div>
                    </div>

                    <p class="text-white/40 tracking-[0.3em] text-xs font-mono uppercase animate-pulse">
                        Initialisation...
                    </p>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Keyframes for animations */
@keyframes loading-bar {
    0% {
        width: 0%;
        left: 0;
    }

    50% {
        width: 100%;
        left: 0;
    }

    100% {
        width: 100%;
        left: 100%;
    }
}

@keyframes glow-pulse {

    0%,
    100% {
        opacity: 0;
        transform: scale(0.8);
    }

    50% {
        opacity: 1;
        transform: scale(1.1);
    }
}

@keyframes gradient-x {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.animate-loading-bar {
    animation: loading-bar 2s ease-in-out infinite;
}

.animate-glow-pulse {
    animation: glow-pulse 3s ease-in-out infinite;
}

.animate-gradient-x {
    background-size: 200% auto;
    animation: gradient-x 3s ease infinite;
}

.logo-text {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2));
}

/* Splash transition */
.splash-enter-active,
.splash-leave-active {
    transition: all 0.8s ease-in-out;
}

.splash-enter-from,
.splash-leave-to {
    opacity: 0;
    transform: scale(1.05);
    filter: blur(10px);
}
</style>
