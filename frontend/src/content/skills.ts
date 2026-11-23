import type { CaseStudySlug } from './caseStudies/slugs';
import { todo } from './placeholder';

export interface Skill {
    name: string;
    /** The case studies that used this skill; selecting the skill lists and highlights them (FR-8). */
    usedIn: readonly CaseStudySlug[];
}

export interface SkillGroup {
    name: string;
    skills: readonly Skill[];
}

export const skillsIntro = todo('skills intro', 10);

/** Placeholder groups with placeholder mappings, shaped like the final list; PF-012 replaces both from the CV. */
export const skillGroups: readonly SkillGroup[] = [
    {
        name: todo('skill group 1'),
        skills: [
            { name: todo('skill 1.1'), usedIn: ['ai-assessment-integration', 'scheduling-platform', 'this-site'] },
            { name: todo('skill 1.2'), usedIn: ['legacy-app-web-port', 'postgres-rls-multi-tenancy', 'client-intake-platform'] },
            { name: todo('skill 1.3'), usedIn: ['ai-assessment-integration'] },
        ],
    },
    {
        name: todo('skill group 2'),
        skills: [
            { name: todo('skill 2.1'), usedIn: ['legacy-app-web-port', 'this-site'] },
            { name: todo('skill 2.2'), usedIn: ['scheduling-platform', 'client-intake-platform'] },
        ],
    },
    {
        name: todo('skill group 3'),
        skills: [
            { name: todo('skill 3.1'), usedIn: ['postgres-rls-multi-tenancy', 'this-site'] },
            { name: todo('skill 3.2'), usedIn: ['smart-pole'] },
            { name: todo('skill 3.3'), usedIn: ['ai-assessment-integration', 'client-intake-platform'] },
        ],
    },
];
