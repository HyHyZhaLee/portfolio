import type { ArchitectureDiagram } from './types';

/**
 * TPMA multi-tenancy (PF-022 D-6, Tier B: approved by the owner on 2026-11-24). A signed-in request runs left to right
 * through the connection hook, then splits into the two database guards that meet at the tenant-owned tables; background
 * jobs take the bypass role along the bottom.
 */
export const postgresRlsMultiTenancyDiagram: ArchitectureDiagram = {
    title: 'Tenant isolation in the database',
    summary: 'Every request carries its tenant, and PostgreSQL enforces the boundary.',
    description:
        "A signed-in user's request reaches the Node.js and Express API, where a Sequelize connection hook applies the user's tenant to every database request; a feature-flag kill switch controlled the rollout. In PostgreSQL, Row-Level Security policies let each organization read and write only its own records in about 90 tenant-owned tables, and guard triggers reject a record saved for the wrong tenant. Background jobs have no signed-in user, so they use one named bypass role.",
    ownership: "★ The parts I implemented, under the tech lead's shared-schema strategy. A teammate finished the production rollout.",
    width: 1200,
    height: 364,
    zones: [
        { id: 'client', label: 'Client', x: 12, y: 12, w: 150, h: 340 },
        { id: 'api', label: 'API', x: 170, y: 12, w: 430, h: 340 },
        { id: 'postgresql', label: 'PostgreSQL', x: 608, y: 12, w: 580, h: 340 },
    ],
    nodes: [
        { id: 'browser', label: 'Browser', detail: 'signed-in user', x: 26, y: 122, w: 128, h: 56, icon: { glyph: 'browser' } },
        { id: 'api', label: 'API', detail: 'Node.js, Express', x: 196, y: 122, w: 160, h: 56, icon: { glyph: 'server' } },
        { id: 'hook', label: 'Connection hook', detail: 'Sequelize', x: 416, y: 122, w: 170, h: 56, icon: { glyph: 'job' }, mine: true },
        { id: 'jobs', label: 'Background jobs', x: 196, y: 280, w: 160, h: 56, icon: { glyph: 'job' } },
        { id: 'rls', label: 'RLS policies', x: 650, y: 60, w: 170, h: 56, icon: { glyph: 'database' }, mine: true },
        { id: 'triggers', label: 'Guard triggers', x: 650, y: 184, w: 170, h: 56, icon: { glyph: 'database' }, mine: true },
        { id: 'bypass', label: 'Bypass role', detail: 'skips isolation', x: 650, y: 280, w: 170, h: 56, icon: { glyph: 'person' }, mine: true },
        { id: 'tables', label: 'Tenant-owned tables', detail: '~90', x: 910, y: 122, w: 250, h: 56, icon: { glyph: 'database' } },
    ],
    edges: [
        { id: 'browser-api', kind: 'main', from: { node: 'browser', side: 'right' }, to: { node: 'api', side: 'left' } },
        { id: 'api-hook', kind: 'main', from: { node: 'api', side: 'right' }, to: { node: 'hook', side: 'left' }, killSwitch: true },
        {
            id: 'hook-rls',
            kind: 'main',
            from: { node: 'hook', side: 'right', offset: -10 },
            to: { node: 'rls', side: 'left' },
            via: [
                { x: 624, y: 140 },
                { x: 624, y: 88 },
            ],
        },
        {
            id: 'hook-triggers',
            kind: 'main',
            from: { node: 'hook', side: 'right', offset: 10 },
            to: { node: 'triggers', side: 'left' },
            via: [
                { x: 624, y: 160 },
                { x: 624, y: 212 },
            ],
        },
        { id: 'rls-tables', kind: 'main', from: { node: 'rls', side: 'right' }, to: { node: 'tables', side: 'left', offset: -10 } },
        { id: 'triggers-tables', kind: 'main', from: { node: 'triggers', side: 'right' }, to: { node: 'tables', side: 'left', offset: 10 } },
        { id: 'jobs-bypass', kind: 'main', from: { node: 'jobs', side: 'right' }, to: { node: 'bypass', side: 'left' } },
        { id: 'bypass-tables', kind: 'main', from: { node: 'bypass', side: 'right' }, to: { node: 'tables', side: 'bottom' } },
    ],
    steps: [
        { text: "A signed-in user's request reaches the API.", edges: ['browser-api'], badge: { x: 175, y: 128 } },
        { text: "The connection hook applies the user's tenant to every database request.", edges: ['api-hook'], badge: { x: 386, y: 124 }, mine: true },
        {
            text: 'Row-Level Security policies let each organization read and write only its own records.',
            edges: ['hook-rls', 'rls-tables'],
            badge: { x: 882, y: 66 },
            mine: true,
        },
        {
            text: 'Guard triggers reject a record saved for the wrong tenant.',
            edges: ['hook-triggers', 'triggers-tables'],
            badge: { x: 882, y: 234 },
            mine: true,
        },
        {
            text: 'Background jobs have no signed-in user, so they use one named bypass role.',
            edges: ['jobs-bypass', 'bypass-tables'],
            badge: { x: 500, y: 290 },
            mine: true,
        },
        { text: 'A feature-flag kill switch controlled the rollout.', edges: ['api-hook'], badge: { x: 386, y: 176 }, mine: true },
    ],
};
