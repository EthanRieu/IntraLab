import type { Config } from 'tailwindcss'

export default {
    content: [
        './app/components/**/*.{js,vue,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/plugins/**/*.{js,ts}',
        './app/app.vue',
        './app/error.vue'
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#1A1A1A',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Examples of single colors
                accent: '#facc15',
                danger: '#ef4444',
            },
            backgroundImage: {
                'custom-gradient': 'linear-gradient(to bottom, #1A1A1A, #0A0A0A)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Merriweather', 'serif'],
                mono: ['Fira Code', 'monospace'],
            },
            container: {
                center: true,
                padding: '2rem',
            },
        },
    },
    plugins: [],
} satisfies Config
