interface ImportMetaEnv {
    /** Backend origin, such as https://example.onrender.com. Empty in development, where the Vite proxy forwards API paths. */
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
