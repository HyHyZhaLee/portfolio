import type { CaseStudy } from './types';

export const aiAssessmentIntegration: CaseStudy = {
    slug: 'ai-assessment-integration',
    title: 'Frontera AI Clinical-Assessment Integration - Event-Driven AWS System',
    metaDescription:
        'How I helped connect three healthcare systems to an external AI assessment platform with an event-driven AWS integration that detects, retries and recovers from failures.',
    angle: 'Connecting three systems with an event-driven AWS integration that recovers from failures.',
    role: "Main implementer under the tech lead's architecture",
    problemLine: "Clinicians wrote every initial assessment report by hand, a slow step before a client's treatment could be authorized.",
    outcomeLine: 'v1.0.0 reached production in May 2026.',
    chips: ['Spring Boot', 'AWS EventBridge, SQS and Lambda', 'TypeScript'],
    period: '03/2026 – 07/2026',
    team: "Main implementer (70+ tickets) under the tech lead's architecture, working directly with QA, product and DevOps",
    stack: ['Java 21', 'Spring Boot', 'TypeScript', 'React', 'PostgreSQL', 'AWS (EventBridge, SQS, Lambda)'],
    outcomes: [
        'v1.0.0 reached production in May 2026.',
        '136 Jest tests covering the TypeScript Lambda functions.',
        'A release-blocking race condition fixed before launch.',
    ],
    links: [],
    context: [
        'Frontera is an external AI platform that drafts ABA assessment reports and treatment plans. MyBrightLink is the platform clinicians use for treatment plans, session data and clinical reports. This project sends new clients and their intake documents to Frontera and brings the AI-generated reports back for a clinician to review.',
    ],
    problem: [
        "Before this, a clinician wrote each initial assessment report by hand. That was slow, and a client's treatment could not be authorized until it was done. The integration had to move clinical documents between three systems reliably. A lost document meant a client waiting for care.",
    ],
    roleAndScope: [
        "I was the main implementer, with more than 70 tickets, working under the tech lead's architecture. The tech lead owned the design and event contracts, DevOps owned the infrastructure, and teammates built other pieces. I owned most of the application layer: the Spring Boot services, the business logic inside the Lambda functions, the failure handling and the practitioner screens. I worked directly with QA, product and DevOps through UAT and the release.",
    ],
    built: [
        'Spring Boot services and event-driven endpoints that sync clients, authorizations, clinical documents and assessment reports across the three systems through EventBridge, SQS and Lambda.',
        'TypeScript Lambda functions that transform and route events, with 136 Jest tests, and service-to-service calls secured with AWS Cognito plus virus scanning of incoming clinical PDFs.',
        'Resilience patterns: Resilience4j retries and circuit breakers, SQS redelivery to dead-letter queues, duplicate-safe event history in PostgreSQL, and manual re-sync APIs.',
        'React screens where practitioners review assessment reports, view PDFs in the app and see sync status, with a manual retry action.',
        'The on-call runbook for the production release, and Datadog troubleshooting across environments.',
    ],
    deepDive: {
        topic: 'The release-blocking race that could drop clinical documents',
        paragraphs: [
            'QA found that a client could have every document uploaded and still never be sent to Frontera, because concurrent processing lost one of them. This blocked the release.',
        ],
    },
    outcome: [
        'v1.0.0 reached production in May 2026, and I wrote the on-call runbook.',
        'Failed syncs are detected, retried and recoverable, automatically or through manual re-sync.',
    ],
    learned: ['Failure paths need as much design as the happy path.'],
    tech: [
        'Java 21',
        'Spring Boot',
        'Resilience4j',
        'TypeScript',
        'Jest',
        'React',
        'PostgreSQL',
        'AWS EventBridge',
        'AWS SQS',
        'AWS Lambda',
        'Amazon Cognito',
        'Datadog',
        'GitLab CI',
    ],
};
