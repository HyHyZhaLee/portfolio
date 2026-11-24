import type { CaseStudySlug } from './caseStudies/slugs';

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

/** Who the site is about: the owner-reviewed copy for the hero, the About section, and the contact links (PF-012). */
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
    where: 'Ho Chi Minh City, working remotely with a U.S. healthtech team',
    pitch: 'Product-minded software engineer taking end-to-end ownership of features, shipping reliable, well-tested code across backend and frontend in Agile teams.',
    stack: ['Java 21', 'Spring Boot', 'TypeScript', 'React', 'PostgreSQL', 'AWS'],
    proofPoints: [
        { claim: 'Event-driven AWS integration in production', where: 'Frontera integration, v1.0.0 in May 2026', slug: 'ai-assessment-integration' },
        { claim: 'PostgreSQL Row-Level Security tenant isolation', where: 'TPMA multi-tenancy, in production July 2026', slug: 'postgres-rls-multi-tenancy' },
        { claim: 'Two legacy apps ported to React, in UAT in ~4 weeks', where: 'TPMA (Angular) and DCA (iPad) web port', slug: 'legacy-app-web-port' },
    ],
    about: [
        "I'm a full-stack software engineer at Xolv, a U.S. healthtech company. I build backend services, system integrations and web applications for products that clinicians and families use, across three healthcare products. What I care about most is reliability: tests that run in CI, and fixing a problem at its root instead of patching the symptom.",
        "I use AI coding assistants such as Claude Code to move faster, and I review and verify every change. I'm also pursuing a Master's in Computer Science at Bach Khoa University.",
    ],
    facts: [
        { label: 'Based in', value: 'Ho Chi Minh City, Vietnam' },
        { label: 'Languages', value: 'English (professional working proficiency), Vietnamese (native)' },
        { label: 'Studying', value: "Master's in Computer Science, Bach Khoa University (in progress)" },
    ],
    links: {
        github: 'https://github.com/HyHyZhaLee',
        linkedin: 'https://www.linkedin.com/in/huygialy',
        repository: 'https://github.com/HyHyZhaLee/portfolio',
    },
    cvPath: '/cv.pdf',
};
