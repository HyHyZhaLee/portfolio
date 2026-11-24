import type { ArchitectureDiagram } from './types';

/**
 * TPMA/DCA web port (PF-022 D-5, Tier B: approved by the owner on 2026-11-24, with ★ on the REST API as the plan
 * proposed; corrected the same day: both legacy apps, the DCA iPad app and the TPMA Angular web app, were ported into
 * the MyBrightLink React web app). Each legacy app on the left ports straight across; the DCA screens read plans through
 * the parser along the top and save through the client-side autosave below; the TPMA screens' plans reach PostgreSQL
 * along the bottom.
 */
export const legacyAppWebPortDiagram: ArchitectureDiagram = {
    title: 'Porting TPMA and DCA to one React web app',
    summary: 'Two legacy apps rebuilt as React screens in MyBrightLink; the data-collection screens run on an API that mirrors the old mobile endpoints.',
    description:
        'The team ported two legacy apps into the MyBrightLink React web app: the offline-first DCA iPad app, whose behavior lived in its API calls, local SQLite data and sync rules, and the TPMA Angular web app for treatment planning. The React data-collection screens call a Node.js and Express REST API that mirrors the legacy mobile endpoints and stores data in PostgreSQL. A treatment-plan parser maps the nested plan data into session screens, and a client-side autosave sends versioned saves to the API, with group sessions saved per client. Clinicians write treatment plans in the React treatment-planning screens, and a server-side autosave writes the session data back into the plan.',
    ownership:
        '★ The parts I built, as one of five developers. Teammates built most of the treatment-planning screens, the server-side autosave and the write-back.',
    width: 1200,
    height: 432,
    zones: [
        { id: 'before', label: 'Before: legacy apps', x: 12, y: 12, w: 210, h: 408 },
        { id: 'after', label: 'After: MyBrightLink React web app', x: 230, y: 12, w: 530, h: 408 },
        { id: 'server', label: 'Server', x: 768, y: 12, w: 420, h: 408 },
    ],
    nodes: [
        { id: 'dca-legacy', label: 'DCA iPad app', detail: 'SQLite and sync rules', x: 28, y: 140, w: 178, h: 64, icon: { glyph: 'device' } },
        { id: 'tpma-legacy', label: 'TPMA web app', detail: 'Angular', x: 28, y: 336, w: 178, h: 56, icon: { glyph: 'browser' } },
        { id: 'dca-screens', label: 'DCA screens', detail: 'data collection, React', x: 280, y: 140, w: 220, h: 64, icon: { glyph: 'browser' }, mine: true },
        { id: 'tpma-screens', label: 'TPMA screens', detail: 'treatment planning, React', x: 280, y: 336, w: 220, h: 56, icon: { glyph: 'browser' } },
        { id: 'parser', label: 'Treatment-plan parser', x: 520, y: 50, w: 206, h: 56, icon: { glyph: 'document' }, mine: true },
        { id: 'autosave', label: 'Autosave, client side', x: 520, y: 262, w: 206, h: 56, icon: { glyph: 'job' }, mine: true },
        { id: 'api', label: 'REST API', detail: 'Node.js, Express', x: 800, y: 140, w: 170, h: 64, icon: { glyph: 'server' }, mine: true },
        { id: 'database', label: 'PostgreSQL', x: 1010, y: 140, w: 160, h: 64, icon: { glyph: 'database' } },
        { id: 'server-autosave', label: 'Server autosave', detail: 'and plan write-back', x: 990, y: 40, w: 180, h: 56, icon: { glyph: 'server' } },
    ],
    edges: [
        { id: 'dca-port', kind: 'main', from: { node: 'dca-legacy', side: 'right' }, to: { node: 'dca-screens', side: 'left' } },
        { id: 'tpma-port', kind: 'main', from: { node: 'tpma-legacy', side: 'right' }, to: { node: 'tpma-screens', side: 'left' } },
        { id: 'screens-api', kind: 'main', from: { node: 'dca-screens', side: 'right' }, to: { node: 'api', side: 'left' } },
        { id: 'api-database', kind: 'main', from: { node: 'api', side: 'right' }, to: { node: 'database', side: 'left' } },
        {
            id: 'api-parser',
            kind: 'return',
            from: { node: 'api', side: 'top' },
            to: { node: 'parser', side: 'right' },
            label: 'treatment plans',
            labelAt: { x: 812, y: 70 },
        },
        { id: 'parser-screens', kind: 'main', from: { node: 'parser', side: 'left' }, to: { node: 'dca-screens', side: 'top' } },
        { id: 'screens-autosave', kind: 'main', from: { node: 'dca-screens', side: 'bottom' }, to: { node: 'autosave', side: 'left' } },
        {
            id: 'autosave-api',
            kind: 'main',
            from: { node: 'autosave', side: 'right' },
            to: { node: 'api', side: 'bottom', offset: -20 },
            label: 'versioned saves',
            labelAt: { x: 812, y: 282 },
        },
        { id: 'api-server-autosave', kind: 'main', from: { node: 'api', side: 'top', offset: 40 }, to: { node: 'server-autosave', side: 'left' } },
        { id: 'server-autosave-database', kind: 'main', from: { node: 'server-autosave', side: 'bottom' }, to: { node: 'database', side: 'top', offset: -10 } },
        {
            id: 'tpma-database',
            kind: 'main',
            from: { node: 'tpma-screens', side: 'right' },
            to: { node: 'database', side: 'bottom' },
            label: 'plans written by clinicians',
            labelAt: { x: 640, y: 356 },
        },
    ],
    steps: [
        {
            text: "I analyzed the DCA iPad app's API calls, local SQLite data and sync rules, and wrote the migration plan.",
            edges: ['dca-port'],
            badge: { x: 243, y: 150 },
            mine: true,
        },
        {
            text: 'The DCA screens load appointments, check-in and check-out, clients and treatment plans through an Express API that mirrors the legacy mobile endpoints.',
            edges: ['screens-api', 'api-database'],
            badge: { x: 650, y: 160 },
            mine: true,
        },
        {
            text: 'Treatment planning moved from the TPMA Angular web app into the same React app, where clinicians write each plan; the server-side autosave writes session data back into it.',
            edges: ['tpma-port', 'tpma-database', 'api-server-autosave', 'server-autosave-database'],
            badge: { x: 243, y: 346 },
        },
        {
            text: 'The parser maps nested plan data (six goal types plus behavior and fluency data) into session screens.',
            edges: ['api-parser', 'parser-screens'],
            badge: { x: 465, y: 60 },
            mine: true,
        },
        {
            text: "Autosave sends versioned saves, so a background refresh never overwrites a clinician's unsaved input.",
            edges: ['screens-autosave', 'autosave-api'],
            badge: { x: 465, y: 304 },
            mine: true,
        },
        {
            text: 'Group sessions save per client, so a failure stays contained to one client.',
            edges: ['autosave-api'],
            nodes: ['autosave'],
            badge: { x: 805, y: 312 },
            mine: true,
        },
    ],
};
