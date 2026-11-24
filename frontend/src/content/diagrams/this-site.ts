import type { ArchitectureDiagram } from './types';

/**
 * This portfolio (PF-022 D-2, Tier A). Static pages on the left never wait; the API in the middle adds live extras.
 * Whichever of PF-014 and PF-022 merges second updates this diagram for the content API.
 */
export const thisSiteDiagram: ArchitectureDiagram = {
    title: "This portfolio's architecture",
    summary: 'Static pages that never wait, and a small API that adds live extras.',
    description:
        'The browser loads the static site from Vercel and renders every page without waiting for the API. The status panel, the visit counter and the contact form call the Spring Boot API on Render, which stores visits and messages in PostgreSQL on Neon and emails messages through Resend; a scheduled job retries failed sends. GitHub Actions runs the checks and deploys the site and the API.',
    ownership: 'Solo project: I designed and built all of it.',
    width: 1200,
    height: 368,
    zones: [
        { id: 'visitor', label: 'Visitor', x: 12, y: 12, w: 170, h: 344 },
        { id: 'vercel', label: 'Vercel', x: 190, y: 12, w: 220, h: 344 },
        { id: 'render', label: 'Render', x: 418, y: 12, w: 300, h: 344 },
        { id: 'neon', label: 'Neon', x: 726, y: 12, w: 200, h: 344 },
        { id: 'services', label: 'Services', x: 934, y: 12, w: 254, h: 344 },
    ],
    nodes: [
        { id: 'browser', label: 'Browser', x: 28, y: 170, w: 138, h: 56, icon: { glyph: 'browser' } },
        { id: 'static', label: 'Static site', detail: 'React, prerendered pages', x: 206, y: 60, w: 188, h: 64, icon: { glyph: 'layers' } },
        { id: 'api', label: 'API', detail: 'Spring Boot', x: 440, y: 170, w: 200, h: 56, icon: { glyph: 'server' } },
        { id: 'job', label: 'Contact retry job', x: 440, y: 284, w: 170, h: 56, icon: { glyph: 'job' } },
        { id: 'database', label: 'PostgreSQL', x: 748, y: 170, w: 156, h: 56, icon: { glyph: 'database' } },
        { id: 'github', label: 'GitHub Actions', detail: 'checks, then deploy', x: 956, y: 64, w: 210, h: 56, icon: { glyph: 'job' } },
        { id: 'resend', label: 'Resend email', x: 956, y: 270, w: 210, h: 56, icon: { glyph: 'external' } },
    ],
    edges: [
        { id: 'browser-static', kind: 'main', from: { node: 'browser', side: 'top' }, to: { node: 'static', side: 'left' } },
        { id: 'browser-api', kind: 'main', from: { node: 'browser', side: 'right' }, to: { node: 'api', side: 'left' } },
        { id: 'api-database', kind: 'main', from: { node: 'api', side: 'right' }, to: { node: 'database', side: 'left' } },
        { id: 'api-resend', kind: 'main', from: { node: 'api', side: 'bottom', offset: 90 }, to: { node: 'resend', side: 'left', offset: -14 } },
        {
            id: 'job-resend',
            kind: 'failure',
            from: { node: 'job', side: 'right' },
            to: { node: 'resend', side: 'left', offset: 14 },
            label: 'retries failed sends',
            labelAt: { x: 783, y: 330 },
        },
        {
            id: 'github-static',
            kind: 'main',
            from: { node: 'github', side: 'left' },
            to: { node: 'static', side: 'right' },
            label: 'deploy',
            labelAt: { x: 560, y: 84 },
        },
        {
            id: 'github-api',
            kind: 'main',
            from: { node: 'github', side: 'bottom', offset: -60 },
            to: { node: 'api', side: 'top', offset: 40 },
            via: [
                { x: 996, y: 145 },
                { x: 580, y: 145 },
            ],
        },
    ],
    steps: [
        { text: 'The page renders from static files on Vercel; no section waits for the API.', edges: ['browser-static'], badge: { x: 97, y: 131 } },
        {
            text: 'The status panel calls the API, which can take about a minute to wake on the free tier; the page stays usable meanwhile.',
            edges: ['browser-api'],
            badge: { x: 300, y: 198 },
        },
        {
            text: 'A page view is stored as a keyed hash with the path, the referrer host and a device class: no cookies, no raw IP address.',
            edges: ['browser-api', 'api-database'],
            badge: { x: 694, y: 198 },
        },
        {
            text: 'A contact message is saved as pending, then emailed through Resend with no database transaction open; a scheduled job retries failed sends.',
            edges: ['browser-api', 'api-database', 'api-resend', 'job-resend'],
            badge: { x: 790, y: 284 },
        },
        { text: 'GitHub Actions runs the checks and deploys both apps.', edges: ['github-static', 'github-api'], badge: { x: 700, y: 92 } },
    ],
};
