import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const smartPole: CaseStudy = {
    slug: 'smart-pole',
    title: todo('smart-pole title', 6),
    metaDescription: todo('smart-pole meta description', 25),
    angle: todo('smart-pole angle', 24),
    role: todo('smart-pole role', 8),
    problemLine: todo('smart-pole problem line', 13),
    outcomeLine: todo('smart-pole outcome line', 9),
    chips: [todo('smart-pole chip 1'), todo('smart-pole chip 2'), todo('smart-pole chip 3')],
    period: todo('smart-pole period'),
    team: todo('smart-pole team', 10),
    stack: [todo('smart-pole stack 1'), todo('smart-pole stack 2'), todo('smart-pole stack 3'), todo('smart-pole stack 4')],
    outcomes: [todo('smart-pole outcome 1', 7)],
    links: [{ label: todo('smart-pole link 1 label'), href: todoHref('smart-pole-link-1') }],
    context: [todo('smart-pole context', 70)],
    problem: [todo('smart-pole problem', 70)],
    roleAndScope: [todo('smart-pole role and scope', 40)],
    built: [todo('smart-pole built item 1', 20), todo('smart-pole built item 2', 20), todo('smart-pole built item 3', 20)],
    deepDive: {
        topic: todo('smart-pole deep dive topic', 7),
        paragraphs: [todo('smart-pole deep dive paragraph 1', 80), todo('smart-pole deep dive paragraph 2', 60)],
    },
    outcome: [todo('smart-pole outcome', 40)],
    learned: [todo('smart-pole lessons', 40)],
    tech: [todo('smart-pole tech 1'), todo('smart-pole tech 2'), todo('smart-pole tech 3'), todo('smart-pole tech 4'), todo('smart-pole tech 5')],
};
