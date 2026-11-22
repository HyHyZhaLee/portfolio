/** `data-test-id` values, named `{feature}-{element}-{type}`. Tests find elements by these or by role, never by CSS. */
export const TestIds = {
    app: {
        skipLink: 'app-skip-link',
        main: 'app-main-region',
    },
    home: {
        heading: 'home-title-heading',
    },
    notFound: {
        homeLink: 'not-found-home-link',
    },
    routeError: {
        homeLink: 'route-error-home-link',
    },
} as const;

export function getTestIdProp(id: string): { 'data-test-id': string } {
    return { 'data-test-id': id };
}
