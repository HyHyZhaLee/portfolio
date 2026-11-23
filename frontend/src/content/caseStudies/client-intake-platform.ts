import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const clientIntakePlatform: CaseStudy = {
    slug: 'client-intake-platform',
    title: todo('client-intake-platform title', 6),
    metaDescription: todo('client-intake-platform meta description', 25),
    angle: todo('client-intake-platform angle', 24),
    role: todo('client-intake-platform role', 8),
    problemLine: todo('client-intake-platform problem line', 13),
    outcomeLine: todo('client-intake-platform outcome line', 9),
    chips: [todo('client-intake-platform chip 1'), todo('client-intake-platform chip 2'), todo('client-intake-platform chip 3')],
    period: todo('client-intake-platform period'),
    team: todo('client-intake-platform team', 10),
    stack: [
        todo('client-intake-platform stack 1'),
        todo('client-intake-platform stack 2'),
        todo('client-intake-platform stack 3'),
        todo('client-intake-platform stack 4'),
    ],
    outcomes: [todo('client-intake-platform outcome 1', 7), todo('client-intake-platform outcome 2', 7)],
    links: [{ label: todo('client-intake-platform link 1 label'), href: todoHref('client-intake-platform-link-1') }],
    context: [todo('client-intake-platform context', 70)],
    problem: [todo('client-intake-platform problem', 70)],
    roleAndScope: [todo('client-intake-platform role and scope', 40)],
    built: [
        todo('client-intake-platform built item 1', 20),
        todo('client-intake-platform built item 2', 20),
        todo('client-intake-platform built item 3', 20),
        todo('client-intake-platform built item 4', 20),
    ],
    deepDive: {
        topic: todo('client-intake-platform deep dive topic', 7),
        paragraphs: [todo('client-intake-platform deep dive paragraph 1', 80), todo('client-intake-platform deep dive paragraph 2', 60)],
    },
    outcome: [todo('client-intake-platform outcome', 40)],
    learned: [todo('client-intake-platform lessons', 40)],
    tech: [
        todo('client-intake-platform tech 1'),
        todo('client-intake-platform tech 2'),
        todo('client-intake-platform tech 3'),
        todo('client-intake-platform tech 4'),
        todo('client-intake-platform tech 5'),
    ],
};
