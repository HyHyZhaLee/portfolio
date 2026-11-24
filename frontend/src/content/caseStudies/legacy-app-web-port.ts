import type { CaseStudy } from './types';

export const legacyAppWebPort: CaseStudy = {
    slug: 'legacy-app-web-port',
    title: 'TPMA/DCA Web Port - ABA Treatment Planning & Session Data Collection',
    metaDescription:
        "How I helped replace an offline iPad data-collection app with a React web module for ABA therapy sessions, without losing a clinician's unsaved input.",
    angle: "Replacing an offline iPad app with a web module without losing a clinician's input.",
    role: 'One of five developers; largest contributor to the data-collection module',
    problemLine: "An offline-first iPad app for session data collection had to move to the web without overwriting a clinician's unsaved input.",
    outcomeLine: 'First web build in UAT in ~4 weeks; in production in July 2026.',
    chips: ['React and TypeScript', 'Node.js and Express', 'PostgreSQL'],
    period: '01/2026 – 06/2026',
    team: 'One of five developers.',
    stack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Vitest', 'GitLab CI'],
    outcomes: [
        'First web build in UAT in ~4 weeks, then several months of UAT fixes before production in July 2026.',
        'Unit-test coverage raised from ~20% to 82%, with an 80% gate in GitLab CI.',
        'Group sessions save each client separately after a combined save failed.',
    ],
    links: [],
    context: [
        "TPMA and DCA are the tools ABA-therapy practitioners use to plan and run sessions. Clinicians write a client's treatment plan in TPMA, and behavior technicians record trial-by-trial session data in DCA (prompt levels, responses, behavior counts and durations). That data flows back into the plan.",
    ],
    problem: [
        "DCA lived in a legacy offline-first iPad app built with Ionic, Angular and Cordova. The team needed the same data collection inside the MyBrightLink React web app. Nobody had a spec: the behavior lived in the old app's API calls, its local SQLite data and its sync rules. The risk was clear. A clinician mid-session cannot lose what they have typed.",
    ],
    roleAndScope: [
        'I was one of five developers on the port and the largest contributor to the data-collection module.',
        'I wrote the migration plan, the treatment-plan parser, the client side of autosave, the group-session saving and, later, the coverage work. I do not claim the decision on where the data is stored.',
    ],
    built: [
        "Migration plan from the old app. I analyzed the legacy app's API calls, local SQLite data and sync rules, and wrote the plan the team worked from.",
        'Screens and API. React/TypeScript data-collection screens and a Node.js/Express REST API that mirrors the legacy mobile endpoints (appointments, check-in/check-out, clients, treatment plans).',
        'Treatment-plan parser. It maps nested legacy plan data (six goal types plus behavior and fluency data) into session screens.',
        "Versioned, duplicate-safe autosave. Background refreshes no longer overwrite a clinician's unsaved input.",
        'Test coverage. Unit-test coverage rose from ~20% to 82% with Vitest and React Testing Library, and a CI gate keeps it at 80%.',
    ],
    deepDive: {
        topic: 'Group sessions: when one save for everyone failed',
        paragraphs: [
            "The trade-off is more, smaller requests in exchange for failures that stay contained to one client. The same pass fixed a bug where one client's treatment plan could appear under another client, which is the worst kind of error in clinical software.",
        ],
    },
    outcome: [
        'The first web build reached UAT about four weeks after the first commit. UAT then ran for several months of fixes and refinement, and the module reached production in July 2026 with the TPMA/DCA 1.0.0 release.',
        'Web unit-test coverage went from about 20% to 82%, and GitLab CI now fails below 80%.',
    ],
    tech: ['React', 'TypeScript', 'Vite', 'Node.js', 'Express', 'PostgreSQL', 'Vitest', 'React Testing Library', 'GitLab CI'],
};
