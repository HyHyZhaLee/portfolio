interface ImportMetaEnv {
    /** Backend origin, such as https://example.onrender.com. Empty in development, where the Vite proxy forwards API paths. */
    readonly VITE_API_URL?: string;
    /** The live site's address. Set only for staging builds (Vercel's Preview environment); its presence shows the staging badge (PF-027 D18). */
    readonly VITE_LIVE_SITE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/** The site's version, such as `v1.0.0`: `v` plus `version` in frontend/package.json, defined in vite.config.ts (PF-027 P16). */
declare const __APP_VERSION__: string;
