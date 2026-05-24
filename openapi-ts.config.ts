import { defineConfig } from '@hey-api/openapi-ts';
import { loadEnv } from 'vite';

const env = loadEnv(
    process.env.NODE_ENV || 'development',
    process.cwd(),
    ''
);

const targets = ['identity', 'platform', 'cms', 'ptm'];
const inputs = targets.map(endpoint => `${env.PUBLIC_API_BASE_URL}/docs/${endpoint}/api.json?docs_key=${env.PUBLIC_API_DOCS_KEY}`);
const outputs = targets.map(endpoint => `src/lib/sdk/${endpoint}`);

export default defineConfig({
    input: inputs,
    output: outputs,
});