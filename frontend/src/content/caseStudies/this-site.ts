import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const thisSite: CaseStudy = {
    slug: 'this-site',
    title: todo('this-site title', 6),
    metaDescription: todo('this-site meta description', 25),
    angle: todo('this-site angle', 24),
    role: todo('this-site role', 8),
    problemLine: todo('this-site problem line', 13),
    outcomeLine: todo('this-site outcome line', 9),
    chips: [todo('this-site chip 1'), todo('this-site chip 2'), todo('this-site chip 3')],
    period: todo('this-site period'),
    team: todo('this-site team', 10),
    stack: [todo('this-site stack 1'), todo('this-site stack 2'), todo('this-site stack 3'), todo('this-site stack 4')],
    outcomes: [todo('this-site outcome 1', 7), todo('this-site outcome 2', 7), todo('this-site outcome 3', 7)],
    links: [
        { label: todo('this-site source link label'), href: 'https://github.com/HyHyZhaLee/portfolio' },
        { label: todo('this-site API docs link label'), href: todoHref('this-site-api-docs') },
    ],
    context: [todo('this-site context', 70)],
    problem: [todo('this-site problem', 70)],
    roleAndScope: [todo('this-site role and scope', 40)],
    built: [
        todo('this-site built item 1', 20),
        todo('this-site built item 2', 20),
        todo('this-site built item 3', 20),
        todo('this-site built item 4', 20),
        todo('this-site built item 5', 20),
    ],
    deepDive: {
        topic: todo('this-site deep dive topic', 7),
        paragraphs: [todo('this-site deep dive paragraph 1', 80), todo('this-site deep dive paragraph 2', 60)],
    },
    outcome: [todo('this-site outcome', 40)],
    learned: [todo('this-site lessons', 40)],
    tech: [todo('this-site tech 1'), todo('this-site tech 2'), todo('this-site tech 3'), todo('this-site tech 4'), todo('this-site tech 5')],
};
