import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
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

/**
 * Preloads the two critical fonts (the headings and the body text) from the built HTML.
 * They then start downloading with the HTML instead of after the script renders text, which cut the simulated first paint from 2.7 s to 1.7 s (PF-026 D4).
 * `crossorigin` matches the CSS font fetch, so each file downloads once.
 * The build fails if a fontsource upgrade renames the files, so the links cannot silently go stale.
 * The prerender step copies `dist/index.html`, so the case-study pages get the same links.
 */
function preloadFonts(): Plugin {
    const criticalFont = /^assets\/(bricolage-grotesque|source-serif-4)-latin-opsz-normal-[\w-]+\.woff2$/;
    let base = '/';
    return {
        name: 'preload-critical-fonts',
        apply: 'build',
        configResolved(config) {
            base = config.base;
        },
        transformIndexHtml: {
            order: 'post',
            handler(_html, ctx): HtmlTagDescriptor[] {
                if (!ctx.bundle) return [];
                const files = Object.keys(ctx.bundle)
                    .filter((file) => criticalFont.test(file))
                    .sort();
                if (files.length !== 2) {
                    throw new Error(`Expected two critical font files matching ${criticalFont}, found ${files.length}: ${files.join(', ')}`);
                }
                return files.map((file) => ({
                    tag: 'link',
                    attrs: { rel: 'preload', href: base + file, as: 'font', type: 'font/woff2', crossorigin: true },
                    injectTo: 'head',
                }));
            },
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, repositoryRoot, '');
    const backendUrl = `http://localhost:${port(env.SERVER_PORT, 8080)}`;
    return {
        plugins: [react(), tailwindcss(), preloadFonts()],
        build: { sourcemap: true },
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
