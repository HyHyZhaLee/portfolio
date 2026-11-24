import type { CaseStudy } from './types';

export const schedulingPlatform: CaseStudy = {
    slug: 'scheduling-platform',
    title: 'Clockwork - Healthcare Scheduling Platform',
    metaDescription:
        'How I built scheduling features that work around conflicts instead of failing: partial offer acceptance, authorization monitoring and incremental Microsoft 365 calendar sync.',
    angle: 'Scheduling that works around conflicts instead of failing.',
    role: 'Full-stack feature owner across 80+ tickets',
    problemLine: 'One taken slot should not reject a whole recurring schedule offer, and booking conflicts should be flagged, not missed.',
    outcomeLine: 'Accepting an offer books every session still available and records why the rest were skipped.',
    chips: ['Java 21 and Spring Boot GraphQL', 'React and TypeScript', 'PostgreSQL'],
    period: '06/2026 – Present',
    team: 'Full-stack feature owner on an established codebase (80+ tickets)',
    stack: ['Java 21', 'Spring Boot', 'GraphQL', 'React', 'TypeScript', 'PostgreSQL'],
    outcomes: [
        'Accepting a recurring offer books every available session and records the skipped ones.',
        'Insurance-authorization changes from Salesforce are checked every 30 minutes and flagged for schedulers.',
        'Microsoft 365 room calendars sync every 5 minutes instead of hourly full reloads.',
    ],
    links: [],
    context: [
        "Clockwork is the scheduling platform that behavioral-health practices (ABA, early intervention, group therapy) use to book individual and group therapy sessions. Every booking has to fit practitioner, client and room availability, holidays and each client's insurance authorization. It integrates with Salesforce, Microsoft 365 and Zoom.",
    ],
    problem: [
        'A family accepting a recurring offer might find that one slot had since been taken, and the whole acceptance failed. An insurance authorization could be shortened in Salesforce and nobody would know which booked appointments were no longer covered. Room calendars in Microsoft 365 were reloaded in full every hour. Each meant manual rework for schedulers.',
    ],
    roleAndScope: [
        "I joined in June 2026 and have worked as a full-stack feature owner on more than 80 tickets. For each feature I built the GraphQL API, database changes, background jobs, the React screens and the tests, behind a feature flag. Some foundations were not mine: the recurrence engine I reused was built by a teammate, and the base Microsoft 365 integration was a teammate's. I owned the incremental sync redesign on top of it.",
    ],
    built: [
        'Offer acceptance that books every session still available and records why the rest were skipped, rather than rejecting the whole offer over one taken slot.',
        "Insurance-authorization monitoring: it tracks authorization changes from Salesforce and flags appointments outside a client's authorized dates, hours or services for schedulers to review.",
        'Holiday and recurring-availability management for practitioners, clients and rooms, with U.S. federal holidays loaded from the Google Calendar API and alerts for clashing bookings.',
        'Microsoft 365 room-calendar sync moved to Microsoft Graph delta queries every 5 minutes, plus a production fix for room calendars that had stopped syncing.',
        'Quartz background jobs on dedicated worker pods, such as 30-minute coverage checks and quarterly holiday loading, processing in batches and safe to re-run.',
    ],
    outcome: [
        'Accepting a recurring offer no longer fails because one slot was taken: available sessions are booked and the rest are logged with a reason.',
        'Schedulers can see when an authorization change leaves appointments uncovered, instead of finding out later.',
        'Room calendars sync in minutes, and the production sync issue is fixed.',
    ],
    tech: [
        'Java 21',
        'Spring Boot',
        'GraphQL (Netflix DGS)',
        'PostgreSQL',
        'Flyway',
        'Quartz',
        'Microsoft Graph',
        'Salesforce',
        'React',
        'TypeScript',
        'MUI',
        'Apollo Client',
        'JUnit 5',
        'Testcontainers',
        'GitLab CI',
    ],
};
