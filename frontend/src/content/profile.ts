import type { CaseStudySlug } from './caseStudies/slugs';
import { todo, todoHref } from './placeholder';

/** A hero claim backed by the case study it links to. */
export interface ProofPoint {
    claim: string;
    where: string;
    slug: CaseStudySlug;
}

export interface Fact {
    label: string;
    value: string;
}

/**
 * Who the site is about. The name, the title, and the GitHub URLs are real (product guide §2, content plan D6); every
 * other block is a placeholder until PF-012 swaps in the reviewed content pack.
 */
export interface Profile {
    name: string;
    title: string;
    where: string;
    pitch: string;
    stack: readonly string[];
    proofPoints: readonly [ProofPoint, ProofPoint, ProofPoint];
    about: readonly string[];
    facts: readonly Fact[];
    links: { github: string; linkedin: string; repository: string };
    cvPath: string;
}

export const profile: Profile = {
    name: 'Will Ly',
    title: 'Full-stack Software Engineer',
    where: todo('where line', 12),
    pitch: todo('hero pitch', 18),
    stack: [todo('stack 1'), todo('stack 2'), todo('stack 3'), todo('stack 4'), todo('stack 5')],
    proofPoints: [
        { claim: todo('proof point 1', 7), where: todo('proof 1 source'), slug: 'ai-assessment-integration' },
        { claim: todo('proof point 2', 7), where: todo('proof 2 source'), slug: 'postgres-rls-multi-tenancy' },
        { claim: todo('proof point 3', 7), where: todo('proof 3 source'), slug: 'legacy-app-web-port' },
    ],
    about: [todo('about paragraph 1', 50), todo('about paragraph 2', 55), todo('about paragraph 3', 40)],
    facts: [
        { label: todo('fact 1 label'), value: todo('fact 1', 6) },
        { label: todo('fact 2 label'), value: todo('fact 2', 8) },
        { label: todo('fact 3 label'), value: todo('fact 3', 12) },
    ],
    links: {
        github: 'https://github.com/HyHyZhaLee',
        linkedin: todoHref('linkedin'),
        repository: 'https://github.com/HyHyZhaLee/portfolio',
    },
    cvPath: '/cv.pdf',
};
