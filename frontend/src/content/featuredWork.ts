import type { CaseStudySlug } from './caseStudies/slugs';

export interface WorkGroup {
    heading: string;
    subheading: string;
    slugs: readonly CaseStudySlug[];
}

export const featuredWorkIntro =
    'Five projects from my work at Xolv, then two of my own. Each card opens a project page with the problem, my role and the outcome.';

/** Featured work: the employer's case studies first, then personal projects, in content plan §6.4 order (FR-4). */
export const featuredWork: readonly WorkGroup[] = [
    {
        heading: 'At Xolv',
        subheading: 'Five projects from healthcare products I worked on',
        slugs: ['ai-assessment-integration', 'scheduling-platform', 'legacy-app-web-port', 'postgres-rls-multi-tenancy', 'client-intake-platform'],
    },
    {
        heading: 'My own projects',
        subheading: 'This site and a university capstone',
        slugs: ['this-site', 'smart-pole'],
    },
];

/** Every featured slug in display order; the case-study page's "next" link follows it. */
export const featuredOrder: readonly CaseStudySlug[] = featuredWork.flatMap((group) => group.slugs);

/** The case study after `slug` in Featured work order; the last one wraps to the first. */
export function nextInFeaturedOrder(slug: CaseStudySlug): CaseStudySlug {
    const index = featuredOrder.indexOf(slug);
    return featuredOrder[(index + 1) % featuredOrder.length] ?? slug;
}
