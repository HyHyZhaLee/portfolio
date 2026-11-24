import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// The repository root holds .env (template: .env.example); the shell environment wins over it.
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

/** A port from the environment, or the fallback when the variable is unset, empty, or not a port number. */
function port(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return value && Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
}

// In development VITE_API_URL is empty, so the API client calls relative paths and Vite forwards them to the backend.
const proxiedPaths = ['/api', '/actuator', '/v3/api-docs', '/swagger-ui'];

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, repositoryRoot, '');
    const backendUrl = `http://localhost:${port(env.SERVER_PORT, 8080)}`;
    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: port(env.FRONTEND_PORT, 5173),
            strictPort: true,
            proxy: Object.fromEntries(proxiedPaths.map((path) => [path, { target: backendUrl }])),
        },
        test: {
            // Playwright specs in e2e/ run with `pnpm test:e2e`, not here.
            include: ['src/**/*.test.{ts,tsx}'],
            environment: 'jsdom',
            // An absolute API origin: in Node, openapi-fetch's \`new Request()\` rejects the relative paths browsers resolve.
            env: { VITE_API_URL: 'http://api.test' },
            setupFiles: ['./src/test/setup.ts'],
            coverage: {
                provider: 'v8',
                include: ['src/**/*.{ts,tsx}'],
                exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/api/schema.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
                thresholds: { branches: 80 },
            },
        },
    };
});
