import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const legacyAppWebPort: CaseStudy = {
    slug: 'legacy-app-web-port',
    title: todo('legacy-app-web-port title', 6),
    metaDescription: todo('legacy-app-web-port meta description', 25),
    angle: todo('legacy-app-web-port angle', 24),
    role: todo('legacy-app-web-port role', 8),
    problemLine: todo('legacy-app-web-port problem line', 13),
    outcomeLine: todo('legacy-app-web-port outcome line', 9),
    chips: [todo('legacy-app-web-port chip 1'), todo('legacy-app-web-port chip 2'), todo('legacy-app-web-port chip 3')],
    period: todo('legacy-app-web-port period'),
    team: todo('legacy-app-web-port team', 10),
    stack: [todo('legacy-app-web-port stack 1'), todo('legacy-app-web-port stack 2'), todo('legacy-app-web-port stack 3'), todo('legacy-app-web-port stack 4')],
    outcomes: [todo('legacy-app-web-port outcome 1', 7), todo('legacy-app-web-port outcome 2', 7), todo('legacy-app-web-port outcome 3', 7)],
    links: [
        { label: todo('legacy-app-web-port link 1 label'), href: todoHref('legacy-app-web-port-link-1') },
        { label: todo('legacy-app-web-port link 2 label'), href: todoHref('legacy-app-web-port-link-2') },
    ],
    context: [todo('legacy-app-web-port context', 70)],
    problem: [todo('legacy-app-web-port problem', 70)],
    roleAndScope: [todo('legacy-app-web-port role and scope', 40)],
    built: [
        todo('legacy-app-web-port built item 1', 20),
        todo('legacy-app-web-port built item 2', 20),
        todo('legacy-app-web-port built item 3', 20),
        todo('legacy-app-web-port built item 4', 20),
    ],
    deepDive: {
        topic: todo('legacy-app-web-port deep dive topic', 7),
        paragraphs: [todo('legacy-app-web-port deep dive paragraph 1', 80), todo('legacy-app-web-port deep dive paragraph 2', 60)],
    },
    outcome: [todo('legacy-app-web-port outcome', 40)],
    learned: [todo('legacy-app-web-port lessons', 40)],
    tech: [
        todo('legacy-app-web-port tech 1'),
        todo('legacy-app-web-port tech 2'),
        todo('legacy-app-web-port tech 3'),
        todo('legacy-app-web-port tech 4'),
        todo('legacy-app-web-port tech 5'),
    ],
};
