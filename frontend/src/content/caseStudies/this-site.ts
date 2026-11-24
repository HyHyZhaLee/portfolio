import type { CaseStudy } from './types';

export const thisSite: CaseStudy = {
    slug: 'this-site',
    title: 'This Portfolio - A Full-Stack Site Built Like Production',
    metaDescription:
        'How this portfolio is built: a React front end, a Spring Boot API and a PostgreSQL database, with tests, CI and anonymous visit counting, published with its source.',
    angle: 'A full-stack portfolio on free hosting, built and tested like production.',
    role: 'Designer and sole builder',
    problemLine: 'A portfolio should show how I build software, not only list what I have done.',
    outcomeLine: 'A live React and Spring Boot site with public source, tests and CI coverage gates.',
    chips: ['React and TypeScript', 'Spring Boot', 'PostgreSQL'],
    period: '11/2026 – Present',
    team: 'Solo project. Uses AI coding assistants such as Claude Code to accelerate development, while reviewing and verifying every change.',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Java 21', 'Spring Boot', 'PostgreSQL', 'Docker', 'GitHub Actions'],
    outcomes: [
        'Every page renders without the API; the API adds only live extras',
        'Backend and frontend branch-coverage gates of 80% in CI, plus a browser smoke test',
        'Lighthouse of at least 90 in all four categories, measured locally on the production build',
    ],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/HyHyZhaLee/portfolio' }],
    context: [
        'This is the site you are reading. It is my portfolio and also a small full-stack system: a React frontend, a Spring Boot API and a PostgreSQL database. The API serves a visit counter, the contact form and a list of my public GitHub projects. I built it to show how I work, so the engineering behind the page matters as much as the page.',
    ],
    problem: [
        'Free hosting is free for a reason. My backend runs on a free tier that goes to sleep when idle, and the first request afterwards can take about a minute. A portfolio that shows a blank page or a spinner for a minute is worse than no backend at all. The constraint was clear: use a real backend, pay nothing, and never let a recruiter wait for it.',
    ],
    roleAndScope: [
        'This is my own project, so I did all of it: requirements, plan, code, tests, CI and this copy. I work in small tickets. Each one gets a written plan before code, tests with the feature, and a review against the plan. I use AI coding assistants such as Claude Code to accelerate development, while reviewing and verifying every change.',
    ],
    built: [
        'Static-first content. Every section and every case study renders from typed content bundled into the frontend. No page waits on a request.',
        'Cold-start handling. A status panel in the hero shows a calm "waking up" state, retries quietly and falls back to a neutral status, while the rest of the page stays unchanged.',
        'Private visit stats. A visit is stored as a keyed hash (HMAC-SHA256 over the IP address and user agent), with the path, the referrer host and a device class. There are no cookies and no raw IP address. The ?notrack=1 link opts a browser out, and the Global Privacy Control signal is honored.',
        'A contact outbox with retries. A message is saved first, then emailed outside any open database transaction. A failed send is marked and retried by a scheduled job, up to three attempts in total. A hidden honeypot field catches bots, and visits and messages are rate-limited (30 visits per minute, 3 messages per hour per client).',
        "A GitHub fallback and link previews. Projects come from the GitHub API with an hour of caching; if GitHub fails, the last good result is used, then a bundled list. A small build step writes one HTML file per case study, so a shared link shows that page's title and description without server-side rendering.",
    ],
    deepDive: {
        topic: 'A contact form that survives outages',
        paragraphs: [
            'The obvious design is to call the email provider inside the request and return an error if it fails. That loses the message whenever the provider has a bad minute, and it holds a database transaction open while waiting on a network call.',
            'I chose an outbox. The API validates the message, saves it as pending, then sends it through the email provider with a bounded retry and exponential backoff. The result is recorded as sent or failed. A scheduled job picks up failed messages about every ten minutes and claims each one with a compare-and-set update, so two runs never send the same message twice. After three attempts in total, it stops and leaves the row for me to read.',
            'The trade-off is that the visitor sees "accepted", not "delivered", and a message can arrive minutes late. For a contact form that is the right trade: a late message is fine, a lost one is not. The cost is more moving parts: a status column, a job and a claim query, all of which I cover with tests.',
        ],
    },
    outcome: [
        'What I can verify today, before the public launch:',
        'The backend and the frontend each enforce an 80% branch-coverage gate in CI.',
        'A Playwright smoke test runs against the production build with the API unreachable, in its own CI workflow, and passes in Chromium and WebKit.',
        'Lighthouse scores are at least 90 for performance, accessibility, best practices and SEO on the home page and a case study, measured locally on the production build with the API unreachable.',
        'Live numbers, such as production Lighthouse scores and cold-start timing, will be added after launch.',
    ],
    learned: [
        'Designing for the failure first, a sleeping API, a failing email provider, an unavailable GitHub, made each feature simpler to reason about, because every one has a defined fallback. I would also set up the smoke test earlier: it caught problems that unit tests did not.',
    ],
    tech: [
        'React',
        'TypeScript',
        'Vite',
        'Tailwind CSS',
        'TanStack Query',
        'Spring Boot',
        'Java 21',
        'PostgreSQL',
        'Flyway',
        'Docker',
        'GitHub Actions',
        'Playwright',
    ],
};
