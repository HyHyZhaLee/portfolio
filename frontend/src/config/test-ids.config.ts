/** `data-test-id` values, named `{feature}-{element}-{type}`. Tests find elements by these or by role, never by CSS. */
export const TestIds = {
    app: {
        skipLink: 'app-skip-link',
        main: 'app-main-region',
    },
    header: {
        homeLink: 'header-home-link',
        navLink: 'header-nav-link',
        cvLink: 'header-cv-link',
        menuButton: 'header-menu-button',
    },
    home: {
        heading: 'home-title-heading',
    },
    hero: {
        workLink: 'hero-work-link',
        cvLink: 'hero-cv-link',
        contactLink: 'hero-contact-link',
        proofLink: 'hero-proof-link',
    },
    work: {
        caseStudyLink: 'work-case-study-link',
    },
    skills: {
        skillButton: 'skills-skill-button',
        usedInLink: 'skills-used-in-link',
    },
    contact: {
        linkedinLink: 'contact-linkedin-link',
        githubLink: 'contact-github-link',
    },
    caseStudy: {
        backLink: 'case-study-back-link',
        nextLink: 'case-study-next-link',
        glanceLink: 'case-study-glance-link',
    },
    apiStatus: {
        panel: 'api-status-panel-region',
        apiState: 'api-status-api-state',
        databaseState: 'api-status-database-state',
        footerState: 'api-status-footer-state',
        howBuiltLink: 'api-status-how-built-link',
    },
    footer: {
        sourceLink: 'footer-source-link',
    },
    stats: {
        counterText: 'stats-counter-text',
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
