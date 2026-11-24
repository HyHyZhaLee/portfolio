// Writes one HTML file per case study next to dist/index.html, with that route's title and description in the head.
// Vercel serves a real file before the SPA rewrite, so link previews and a hard refresh read the right tags (PF-009).
// Run by `pnpm build` after the client build and the SSR build of src/app/routeMeta.ts.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { prerenderedRoutes } = await import(pathToFileURL(join(root, 'node_modules/.tmp/ssr/routeMeta.js')).href);

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Replaces the content of one tag, and fails the build when the tag is missing so a template change cannot go unnoticed. */
function setTag(html, pattern, replacement) {
    if (!pattern.test(html)) {
        throw new Error(`prerender: dist/index.html has no match for ${String(pattern)}`);
    }
    return html.replace(pattern, () => replacement);
}

const template = await readFile(join(dist, 'index.html'), 'utf8');
for (const { path, meta } of prerenderedRoutes()) {
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    let html = setTag(template, /<title>.*?<\/title>/s, `<title>${title}</title>`);
    html = setTag(html, /<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${description}" />`);
    html = setTag(html, /<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${title}" />`);
    html = setTag(html, /<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${description}" />`);
    const directory = join(dist, path);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'index.html'), html);
}
