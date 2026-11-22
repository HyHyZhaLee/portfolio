/** UI strings. Long-form portfolio copy lives in src/content/ instead (frontend/docs/ARCHITECTURE.md, principle 11). */
const en = {
    'app.skipToContent': 'Skip to content',
    'home.underConstruction': 'This site is under construction.',
    'notFound.heading': 'Page not found',
    'notFound.body': 'The page {path} does not exist.',
    'notFound.homeLink': 'Back to the home page',
    'routeError.heading': 'Something went wrong',
    'routeError.body': 'This page failed to display. Please try again, or go back to the home page.',
    'routeError.homeLink': 'Back to the home page',
} as const;

export type MessageKey = keyof typeof en;

/** Returns the string for `key`, replacing each `{name}` placeholder with `params.name`; unknown placeholders are kept. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
    const template: string = en[key];
    return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
        const value = params[name];
        return value === undefined ? placeholder : String(value);
    });
}
