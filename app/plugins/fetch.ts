export default defineNuxtPlugin((nuxtApp) => {
    // Intercept all $fetch calls to inject the Authorization header
    const token = useCookie('auth_token');

    // @ts-ignore
    globalThis.$fetch = $fetch.create({
        onRequest({ options }) {
            if (token.value) {
                // Ensure headers exist and are a Headers instance
                options.headers = new Headers(options.headers || {});
                options.headers.set('Authorization', `Bearer ${token.value}`);
            }
        },
        onResponseError({ response }) {
            if (response.status === 401) {
                token.value = null;
                // nuxtApp.runWithContext(() => navigateTo('/Auth/signIn'));
            }
        }
    });
});
