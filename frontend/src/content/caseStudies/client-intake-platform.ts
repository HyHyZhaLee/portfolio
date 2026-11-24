import type { CaseStudy } from './types';

export const clientIntakePlatform: CaseStudy = {
    slug: 'client-intake-platform',
    title: 'FAST - Funder Integration Technology System',
    metaDescription:
        'How I grew from test automation to owning features on a behavioral-health intake platform, including a self-healing Salesforce sync and an end-to-end test suite.',
    angle: 'From test automation to owning features.',
    role: 'Grew from test automation to owning features (~160 tickets)',
    problemLine: "Behavioral-health intake needed one reliable path from a family's screener survey to staff review and a Salesforce hand-off.",
    outcomeLine: 'A self-healing Salesforce client-profile sync that support staff can reset without database access.',
    chips: ['NestJS and React', 'PostgreSQL', 'AWS Lambda'],
    period: '09/2025 – 04/2026',
    team: 'Full-stack engineer; about 160 tickets.',
    stack: ['TypeScript', 'NestJS', 'React', 'PostgreSQL', 'AWS Lambda', 'Playwright', 'Cucumber'],
    outcomes: [
        'Salesforce client-profile sync made self-healing, with support tools to reset stuck clients without database access.',
        'A daily end-to-end suite verifying ~136 fields across the intake journey in three apps.',
        'Security findings fixed across 16 merge requests, and caregiver time zones expanded to all 50 U.S. states.',
    ],
    links: [],
    context: [
        'FAST is an intake platform for behavioral-health clients referred by several funders. Families complete a screener survey, then manage registration and intro-call booking in a caregiver portal. Staff review each family in an admin portal and hand them off to Salesforce and Clockwork.',
    ],
    problem: [
        'An intake platform fails quietly. A hand-off that breaks leaves a family waiting, and a booking flow that allows double bookings erodes trust. The product needed reliable integrations and automated checks across three apps.',
    ],
    roleAndScope: [
        'I started on test automation and small bugs and moved to owning product features across the NestJS backend, two React portals and the AWS Lambdas, about 160 tickets in all.',
        'Two guardrails matter. I took ownership of the Salesforce client-profile sync, but a teammate built the original. And I built out the end-to-end suite, adding the Cucumber layer, the sign-in automation and the daily CI run.',
    ],
    built: [
        "A self-healing Salesforce sync. Scheduled jobs over a PostgreSQL task queue handle retries, a circuit breaker and stale-task recovery. Support tools reset stuck clients without database access. The queue was later reused as the backend's shared job queue.",
        'Intro-call booking before sign-up. Families book in NestJS and React before creating an account. PostgreSQL advisory locks prevent double bookings, and reminder emails and a status-update job follow.',
        'All 50 U.S. time zones. The change spans the survey, a Lambda processor, the backend, both portals and emails, released behind a feature flag.',
        'Soft delete and an audit log. Deleted clients are hidden from every database read through a Prisma extension, with a React management page and a filterable audit-log page.',
        'End-to-end tests and security fixes. Playwright and Cucumber automate Azure AD SSO and email-OTP sign-in and verify ~136 fields in three apps, daily in GitLab CI with reports in Confluence. I also fixed code-scanning and HackerOne findings across 16 merge requests and moved staff sign-in to a cookie-based OAuth 2.0 + PKCE flow.',
    ],
    outcome: [
        "Clients whose Salesforce message fails are now recovered automatically, and failures are visible to staff. The task queue became the backend's shared job queue. The end-to-end suite runs daily and publishes its reports to Confluence.",
    ],
    learned: [
        'I learned to build operator tools alongside the automation: the self-healing job only paid off once support could see and reset its state themselves.',
    ],
    tech: ['TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'React', 'AWS Lambda', 'Salesforce', 'Playwright', 'Cucumber', 'GitLab CI'],
};
