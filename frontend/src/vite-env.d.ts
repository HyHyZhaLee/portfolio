interface ImportMetaEnv {
    /** Backend origin, such as https://example.onrender.com. Empty in development, where the Vite proxy forwards API paths. */
    readonly VITE_API_URL?: string;
    /** The live site's address. Set only for staging builds (Vercel's Preview environment); its presence shows the staging badge (PF-027 D18). */
    readonly VITE_LIVE_SITE_URL?: string;
    /** The deployed version, set by the deploy job from `git describe` (PF-027 P16). Unset in development and tests. */
    readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
