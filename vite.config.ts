import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
// import { heyApiPlugin } from '@hey-api/vite-plugin';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
    plugins: [
        // heyApiPlugin(),
        tailwindcss(),
        sveltekit(),
    ],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    },
    server: {
        host: 'bocchio.test',
        port: 5173,
        watch: {
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.svelte-kit/**', '**/.netlify/**']
        }
    }
});
