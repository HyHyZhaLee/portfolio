/** `data-test-id` values, named `{feature}-{element}-{type}`. Tests find elements by these or by role, never by CSS. */
export const TestIds = {
    app: {
        skipLink: 'app-skip-link',
        main: 'app-main-region',
    },
    header: {
        homeLink: 'header-home-link',
        navLink: 'header-nav-link',
        menuButton: 'header-menu-button',
        menuDialog: 'header-menu-dialog',
        closeButton: 'header-close-button',
    },
    home: {
        heading: 'home-title-heading',
    },
    hero: {
        workLink: 'hero-work-link',
        contactLink: 'hero-contact-link',
        portrait: 'hero-portrait-image',
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
        emailLink: 'contact-email-link',
        linkedinLink: 'contact-linkedin-link',
        githubLink: 'contact-github-link',
        form: 'contact-form-region',
        nameInput: 'contact-name-input',
        emailInput: 'contact-email-input',
        messageInput: 'contact-message-input',
        websiteInput: 'contact-website-input',
        submitButton: 'contact-submit-button',
        hintText: 'contact-hint-text',
        successRegion: 'contact-success-region',
        anotherButton: 'contact-another-button',
    },
    errorNote: {
        region: 'error-note-region',
        codeText: 'error-note-code-text',
        referenceText: 'error-note-reference-text',
    },
    caseStudy: {
        backLink: 'case-study-back-link',
        nextLink: 'case-study-next-link',
        glanceLink: 'case-study-glance-link',
        glanceToggle: 'case-study-glance-toggle',
        diagram: 'case-study-diagram-figure',
        diagramScroll: 'case-study-diagram-scroll-region',
        diagramStep: 'case-study-diagram-step-button',
        diagramLegend: 'case-study-diagram-legend-list',
        diagramNode: 'case-study-diagram-node-group',
        diagramEdge: 'case-study-diagram-edge-group',
    },
    apiStatus: {
        panel: 'api-status-panel-region',
        apiState: 'api-status-api-state',
        databaseState: 'api-status-database-state',
        footerState: 'api-status-footer-state',
        howBuiltLink: 'api-status-how-built-link',
    },
    education: {
        certificateButton: 'education-certificate-button',
        certificateDialog: 'education-certificate-dialog',
        certificateClose: 'education-certificate-close-button',
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
