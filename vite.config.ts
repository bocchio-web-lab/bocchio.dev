import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
    plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    },
    server: {
        watch: {
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.svelte-kit/**', '**/.netlify/**', '**/.scribe/**']
        }
    }
});
