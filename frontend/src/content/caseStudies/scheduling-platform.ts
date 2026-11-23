import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const schedulingPlatform: CaseStudy = {
    slug: 'scheduling-platform',
    title: todo('scheduling-platform title', 6),
    metaDescription: todo('scheduling-platform meta description', 25),
    angle: todo('scheduling-platform angle', 24),
    role: todo('scheduling-platform role', 8),
    problemLine: todo('scheduling-platform problem line', 13),
    outcomeLine: todo('scheduling-platform outcome line', 9),
    chips: [todo('scheduling-platform chip 1'), todo('scheduling-platform chip 2'), todo('scheduling-platform chip 3')],
    period: todo('scheduling-platform period'),
    team: todo('scheduling-platform team', 10),
    stack: [todo('scheduling-platform stack 1'), todo('scheduling-platform stack 2'), todo('scheduling-platform stack 3'), todo('scheduling-platform stack 4')],
    outcomes: [todo('scheduling-platform outcome 1', 7), todo('scheduling-platform outcome 2', 7)],
    links: [{ label: todo('scheduling-platform link 1 label'), href: todoHref('scheduling-platform-link-1') }],
    context: [todo('scheduling-platform context', 70)],
    problem: [todo('scheduling-platform problem', 70)],
    roleAndScope: [todo('scheduling-platform role and scope', 40)],
    built: [
        todo('scheduling-platform built item 1', 20),
        todo('scheduling-platform built item 2', 20),
        todo('scheduling-platform built item 3', 20),
        todo('scheduling-platform built item 4', 20),
    ],
    deepDive: {
        topic: todo('scheduling-platform deep dive topic', 7),
        paragraphs: [todo('scheduling-platform deep dive paragraph 1', 80), todo('scheduling-platform deep dive paragraph 2', 60)],
    },
    outcome: [todo('scheduling-platform outcome', 40)],
    learned: [todo('scheduling-platform lessons', 40)],
    tech: [
        todo('scheduling-platform tech 1'),
        todo('scheduling-platform tech 2'),
        todo('scheduling-platform tech 3'),
        todo('scheduling-platform tech 4'),
        todo('scheduling-platform tech 5'),
    ],
};
