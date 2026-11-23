import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const postgresRlsMultiTenancy: CaseStudy = {
    slug: 'postgres-rls-multi-tenancy',
    title: todo('postgres-rls-multi-tenancy title', 6),
    metaDescription: todo('postgres-rls-multi-tenancy meta description', 25),
    angle: todo('postgres-rls-multi-tenancy angle', 24),
    role: todo('postgres-rls-multi-tenancy role', 8),
    problemLine: todo('postgres-rls-multi-tenancy problem line', 13),
    outcomeLine: todo('postgres-rls-multi-tenancy outcome line', 9),
    chips: [todo('postgres-rls-multi-tenancy chip 1'), todo('postgres-rls-multi-tenancy chip 2'), todo('postgres-rls-multi-tenancy chip 3')],
    period: todo('postgres-rls-multi-tenancy period'),
    team: todo('postgres-rls-multi-tenancy team', 10),
    stack: [
        todo('postgres-rls-multi-tenancy stack 1'),
        todo('postgres-rls-multi-tenancy stack 2'),
        todo('postgres-rls-multi-tenancy stack 3'),
        todo('postgres-rls-multi-tenancy stack 4'),
    ],
    outcomes: [todo('postgres-rls-multi-tenancy outcome 1', 7), todo('postgres-rls-multi-tenancy outcome 2', 7)],
    links: [{ label: todo('postgres-rls-multi-tenancy link 1 label'), href: todoHref('postgres-rls-multi-tenancy-link-1') }],
    context: [todo('postgres-rls-multi-tenancy context', 70)],
    problem: [todo('postgres-rls-multi-tenancy problem', 70)],
    roleAndScope: [todo('postgres-rls-multi-tenancy role and scope', 40)],
    built: [
        todo('postgres-rls-multi-tenancy built item 1', 20),
        todo('postgres-rls-multi-tenancy built item 2', 20),
        todo('postgres-rls-multi-tenancy built item 3', 20),
    ],
    deepDive: {
        topic: todo('postgres-rls-multi-tenancy deep dive topic', 7),
        paragraphs: [todo('postgres-rls-multi-tenancy deep dive paragraph 1', 80), todo('postgres-rls-multi-tenancy deep dive paragraph 2', 60)],
    },
    outcome: [todo('postgres-rls-multi-tenancy outcome', 40)],
    learned: [todo('postgres-rls-multi-tenancy lessons', 40)],
    tech: [
        todo('postgres-rls-multi-tenancy tech 1'),
        todo('postgres-rls-multi-tenancy tech 2'),
        todo('postgres-rls-multi-tenancy tech 3'),
        todo('postgres-rls-multi-tenancy tech 4'),
        todo('postgres-rls-multi-tenancy tech 5'),
    ],
};
