import type { ArchitectureDiagram } from './types';

/**
 * Clockwork (PF-022 D-4, Tier B: approved by the owner on 2026-11-24). Will built features sprint by sprint across every
 * part of this architecture, so nothing carries ★ and the note describes the role (P4, owner decision 2026-11-24). The app's requests run along the top; the worker pods' jobs pull from
 * the three external services on the right and write to PostgreSQL.
 */
export const schedulingPlatformDiagram: ArchitectureDiagram = {
    title: 'Clockwork scheduling architecture',
    summary: 'Scheduling that books around conflicts and watches authorizations, calendars and holidays.',
    description:
        'Schedulers and families use the React scheduling web app, which calls a Spring Boot GraphQL API backed by PostgreSQL. Quartz jobs on dedicated worker pods track authorization changes from Salesforce, load U.S. federal holidays from the Google Calendar API, and sync room calendars from Microsoft 365 through Microsoft Graph, then write flags and alerts to PostgreSQL for schedulers to review in the web app.',
    ownership:
        "Built sprint by sprint across every part of this architecture as a full-stack feature owner (80+ tickets). The recurrence engine and the base Microsoft 365 integration were teammates' work.",
    width: 1200,
    height: 404,
    zones: [
        { id: 'clockwork', label: 'Clockwork', x: 12, y: 12, w: 848, h: 380 },
        { id: 'external', label: 'External services', x: 868, y: 12, w: 320, h: 380 },
    ],
    nodes: [
        { id: 'web', label: 'Scheduling web app', detail: 'React', x: 40, y: 82, w: 200, h: 56, icon: { glyph: 'browser' } },
        { id: 'api', label: 'GraphQL API', detail: 'Spring Boot', x: 330, y: 82, w: 190, h: 56, icon: { glyph: 'server' } },
        { id: 'database', label: 'PostgreSQL', x: 330, y: 222, w: 190, h: 56, icon: { glyph: 'database' } },
        { id: 'workers', label: 'Worker pods', detail: 'Quartz jobs', x: 600, y: 222, w: 190, h: 56, icon: { glyph: 'job' } },
        { id: 'salesforce', label: 'Salesforce', detail: 'authorization changes', x: 892, y: 122, w: 272, h: 56, icon: { glyph: 'external' } },
        { id: 'microsoft', label: 'Microsoft 365', detail: 'room calendars, Microsoft Graph', x: 892, y: 222, w: 272, h: 56, icon: { glyph: 'external' } },
        { id: 'google', label: 'Google Calendar API', detail: 'U.S. federal holidays', x: 892, y: 322, w: 272, h: 56, icon: { glyph: 'external' } },
    ],
    edges: [
        { id: 'web-api', kind: 'main', from: { node: 'web', side: 'right', offset: -8 }, to: { node: 'api', side: 'left', offset: -8 } },
        { id: 'api-web', kind: 'return', from: { node: 'api', side: 'left', offset: 8 }, to: { node: 'web', side: 'right', offset: 8 } },
        { id: 'api-database', kind: 'main', from: { node: 'api', side: 'bottom' }, to: { node: 'database', side: 'top' } },
        { id: 'workers-database', kind: 'main', from: { node: 'workers', side: 'left' }, to: { node: 'database', side: 'right' } },
        {
            id: 'salesforce-workers',
            kind: 'main',
            from: { node: 'salesforce', side: 'left' },
            to: { node: 'workers', side: 'right', offset: -14 },
            via: [
                { x: 846, y: 150 },
                { x: 846, y: 236 },
            ],
        },
        { id: 'microsoft-workers', kind: 'main', from: { node: 'microsoft', side: 'left' }, to: { node: 'workers', side: 'right' } },
        {
            id: 'google-workers',
            kind: 'main',
            from: { node: 'google', side: 'left' },
            to: { node: 'workers', side: 'right', offset: 14 },
            via: [
                { x: 846, y: 350 },
                { x: 846, y: 264 },
            ],
        },
    ],
    steps: [
        {
            text: 'Accepting a recurring offer books every session still available and records why the rest were skipped.',
            edges: ['web-api', 'api-database'],
            badge: { x: 285, y: 82 },
        },
        {
            text: "Worker pods track authorization changes from Salesforce and, every 30 minutes, flag appointments outside a client's authorized dates, hours or services.",
            edges: ['salesforce-workers', 'workers-database'],
            badge: { x: 880, y: 126 },
        },
        {
            text: 'A quarterly job loads U.S. federal holidays from the Google Calendar API, and clashing bookings raise alerts.',
            edges: ['google-workers', 'workers-database'],
            badge: { x: 880, y: 326 },
        },
        {
            text: 'Every 5 minutes a job syncs room calendars from Microsoft 365 with Microsoft Graph delta queries.',
            edges: ['microsoft-workers', 'workers-database'],
            badge: { x: 880, y: 226 },
        },
        { text: 'Schedulers see the flags and alerts in the React screens.', edges: ['api-web'], badge: { x: 140, y: 160 } },
    ],
};
