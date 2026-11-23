import { todo, todoHref } from '../placeholder';
import type { CaseStudy } from './types';

export const aiAssessmentIntegration: CaseStudy = {
    slug: 'ai-assessment-integration',
    title: todo('ai-assessment-integration title', 6),
    metaDescription: todo('ai-assessment-integration meta description', 25),
    angle: todo('ai-assessment-integration angle', 24),
    role: todo('ai-assessment-integration role', 8),
    problemLine: todo('ai-assessment-integration problem line', 13),
    outcomeLine: todo('ai-assessment-integration outcome line', 9),
    chips: [todo('ai-assessment-integration chip 1'), todo('ai-assessment-integration chip 2'), todo('ai-assessment-integration chip 3')],
    period: todo('ai-assessment-integration period'),
    team: todo('ai-assessment-integration team', 10),
    stack: [
        todo('ai-assessment-integration stack 1'),
        todo('ai-assessment-integration stack 2'),
        todo('ai-assessment-integration stack 3'),
        todo('ai-assessment-integration stack 4'),
    ],
    outcomes: [todo('ai-assessment-integration outcome 1', 7), todo('ai-assessment-integration outcome 2', 7), todo('ai-assessment-integration outcome 3', 7)],
    links: [
        { label: todo('ai-assessment-integration link 1 label'), href: todoHref('ai-assessment-integration-link-1') },
        { label: todo('ai-assessment-integration link 2 label'), href: todoHref('ai-assessment-integration-link-2') },
    ],
    context: [todo('ai-assessment-integration context', 70)],
    problem: [todo('ai-assessment-integration problem', 70)],
    roleAndScope: [todo('ai-assessment-integration role and scope', 40)],
    built: [
        todo('ai-assessment-integration built item 1', 20),
        todo('ai-assessment-integration built item 2', 20),
        todo('ai-assessment-integration built item 3', 20),
        todo('ai-assessment-integration built item 4', 20),
        todo('ai-assessment-integration built item 5', 20),
    ],
    deepDive: {
        topic: todo('ai-assessment-integration deep dive topic', 7),
        paragraphs: [todo('ai-assessment-integration deep dive paragraph 1', 80), todo('ai-assessment-integration deep dive paragraph 2', 60)],
    },
    outcome: [todo('ai-assessment-integration outcome', 40)],
    learned: [todo('ai-assessment-integration lessons', 40)],
    tech: [
        todo('ai-assessment-integration tech 1'),
        todo('ai-assessment-integration tech 2'),
        todo('ai-assessment-integration tech 3'),
        todo('ai-assessment-integration tech 4'),
        todo('ai-assessment-integration tech 5'),
    ],
};
