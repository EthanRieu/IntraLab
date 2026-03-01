import { ref, computed } from 'vue';
import { useCookie, navigateTo } from '#app';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
        slug: string;
        name: string;
    };
}

export const useAuth = () => {
    // Storing the token in a cookie enables sharing state between SSR and CSR
    const token = useCookie<string | null>('auth_token', {
        watch: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const user = ref<User | null>(null);

    const isAuthenticated = computed(() => !!token.value);

    // Sync user state if needed (ideally fetch user profile on app load if token exists)
    // For now we just expose the login function which populates the initial state

    const register = async (userData: any) => {
        try {
            const response = await $fetch<{ success: boolean; data: { token: string; user: User } }>('/api/auth/register', {
                method: 'POST',
                body: userData
            });

            if (response.success && response.data) {
                // Redirect user to sign-in page
                await navigateTo('/Auth/signIn');
                return { success: true };
            }
            return { success: false, error: 'Erreur lors de l\'inscription' };
        } catch (error: any) {
            console.error('Registration error:', error);
            let errorMessage = error.data?.statusMessage || error.statusMessage || 'Erreur lors de l\'inscription';
            if (error.data?.data && Array.isArray(error.data.data) && error.data.data.length > 0) {
                errorMessage = error.data.data.map((i: any) => i.message).join(', ');
            }
            return { success: false, error: errorMessage };
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await $fetch<{ success: boolean; data: { token: string; user: User } }>('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            if (response.success && response.data) {
                token.value = response.data.token;
                user.value = response.data.user;
                // Redirect user to root
                await navigateTo('/');
                return { success: true };
            }
            return { success: false, error: 'Identifiants invalides' };
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.data?.statusMessage || error.statusMessage || 'Erreur lors de la connexion';
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            if (token.value) {
                await $fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token.value}` } }).catch(() => { });
            }
        } finally {
            token.value = null;
            user.value = null;
            await navigateTo('/Auth/signIn');
        }
    };

    return {
        token,
        user,
        isAuthenticated,
        register,
        login,
        logout
    };
};
