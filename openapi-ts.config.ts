import { defineConfig } from '@hey-api/openapi-ts';
import { loadEnv } from 'vite';

const env = loadEnv(
    process.env.NODE_ENV || 'development',
    process.cwd(),
    ''
);

const inputs = ['identity', 'platform', 'cms', 'ptm']
    .map(endpoint => `${env.PUBLIC_API_BASE_URL}/docs/${endpoint}/api.json`);

export default defineConfig({
    input: inputs,
    output: 'src/lib/api/generated',
});