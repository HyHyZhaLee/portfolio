import type { ArchitectureDiagram } from './types';

/**
 * FAST (PF-022 D-7, Tier B: approved by the owner on 2026-11-24). Will built features sprint by sprint across every
 * part of this architecture, so nothing carries ★ and the note describes the role (P4, owner decision 2026-11-24). The three entry points sit on the left, the backend and its task queue in the
 * middle, and the hand-off to Salesforce and Clockwork on the right.
 */
export const clientIntakePlatformDiagram: ArchitectureDiagram = {
    title: 'FAST intake architecture',
    summary: "One path from a family's screener survey to staff review and a Salesforce hand-off.",
    description:
        'A family completes the screener survey, and a Lambda processor passes it to the NestJS backend. In the React caregiver portal the family books an intro call before sign-up, with PostgreSQL advisory locks preventing double bookings. Staff review each family in the React admin portal and hand them off to Salesforce and Clockwork. Scheduled jobs over a PostgreSQL task queue sync the client profile with Salesforce, with retries, a circuit breaker and stale-task recovery, and support staff reset stuck clients with support tools, without database access.',
    ownership:
        'Built sprint by sprint across every part of this architecture, growing from test automation to feature ownership (about 160 tickets). A teammate built the original Salesforce integration; I took ownership of its client-profile sync.',
    width: 1200,
    height: 444,
    zones: [
        { id: 'fast', label: 'FAST', x: 12, y: 12, w: 840, h: 420 },
        { id: 'processing', label: 'Survey processing', x: 236, y: 40, w: 180, h: 150, aws: true },
        { id: 'handoff', label: 'Hand-off', x: 860, y: 12, w: 328, h: 420 },
    ],
    nodes: [
        { id: 'survey', label: 'Screener survey', x: 36, y: 84, w: 170, h: 56, icon: { glyph: 'document' } },
        { id: 'processor', label: 'Lambda processor', x: 304, y: 90, w: 44, h: 44, icon: { aws: 'lambda' }, labelBelow: true },
        { id: 'caregiver', label: 'Caregiver portal', detail: 'React', x: 36, y: 218, w: 170, h: 56, icon: { glyph: 'browser' } },
        { id: 'admin', label: 'Admin portal', detail: 'React', x: 36, y: 352, w: 170, h: 56, icon: { glyph: 'browser' } },
        { id: 'backend', label: 'Backend', detail: 'NestJS', x: 470, y: 218, w: 170, h: 56, icon: { glyph: 'server' } },
        { id: 'database', label: 'PostgreSQL', detail: 'task queue', x: 470, y: 352, w: 170, h: 56, icon: { glyph: 'database' } },
        { id: 'jobs', label: 'Scheduled jobs', x: 680, y: 352, w: 156, h: 56, icon: { glyph: 'job' } },
        { id: 'clockwork', label: 'Clockwork', x: 890, y: 104, w: 270, h: 56, icon: { glyph: 'external' } },
        { id: 'salesforce', label: 'Salesforce', x: 890, y: 218, w: 270, h: 56, icon: { glyph: 'external' } },
    ],
    edges: [
        { id: 'survey-processor', kind: 'main', from: { node: 'survey', side: 'right' }, to: { node: 'processor', side: 'left' } },
        { id: 'processor-backend', kind: 'main', from: { node: 'processor', side: 'right' }, to: { node: 'backend', side: 'top' } },
        { id: 'caregiver-backend', kind: 'main', from: { node: 'caregiver', side: 'right' }, to: { node: 'backend', side: 'left' } },
        {
            id: 'admin-backend',
            kind: 'main',
            from: { node: 'admin', side: 'right' },
            to: { node: 'backend', side: 'left', offset: 16 },
            via: [
                { x: 430, y: 380 },
                { x: 430, y: 262 },
            ],
        },
        { id: 'backend-database', kind: 'main', from: { node: 'backend', side: 'bottom' }, to: { node: 'database', side: 'top' } },
        { id: 'database-jobs', kind: 'main', from: { node: 'database', side: 'right' }, to: { node: 'jobs', side: 'left' } },
        {
            id: 'jobs-salesforce',
            kind: 'main',
            from: { node: 'jobs', side: 'right' },
            to: { node: 'salesforce', side: 'bottom' },
            label: 'client-profile sync',
            labelAt: { x: 940, y: 372 },
        },
        {
            id: 'backend-salesforce',
            kind: 'main',
            from: { node: 'backend', side: 'right' },
            to: { node: 'salesforce', side: 'left' },
            label: 'hand-off',
            labelAt: { x: 820, y: 238 },
        },
        { id: 'backend-clockwork', kind: 'main', from: { node: 'backend', side: 'right', offset: -14 }, to: { node: 'clockwork', side: 'left' } },
    ],
    steps: [
        {
            text: 'A family completes the screener survey, and a Lambda processor passes it to the backend.',
            edges: ['survey-processor', 'processor-backend'],
            badge: { x: 440, y: 96 },
        },
        {
            text: 'In the caregiver portal the family books an intro call before sign-up; PostgreSQL advisory locks prevent double bookings.',
            edges: ['caregiver-backend', 'backend-database'],
            badge: { x: 338, y: 228 },
        },
        {
            text: 'Staff review each family in the admin portal and hand them off to Salesforce and Clockwork.',
            edges: ['admin-backend', 'backend-salesforce', 'backend-clockwork'],
            badge: { x: 700, y: 200 },
        },
        {
            text: 'Scheduled jobs over a PostgreSQL task queue sync the client profile with Salesforce, with retries, a circuit breaker and stale-task recovery.',
            edges: ['database-jobs', 'jobs-salesforce'],
            badge: { x: 1050, y: 330 },
        },
        {
            text: 'Support staff reset stuck clients with support tools, without database access.',
            edges: ['admin-backend', 'backend-database'],
            badge: { x: 338, y: 362 },
        },
    ],
};
