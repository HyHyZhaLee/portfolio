import type { CaseStudySlug } from './caseStudies/slugs';
import { todo } from './placeholder';

export interface WorkGroup {
    heading: string;
    subheading: string;
    slugs: readonly CaseStudySlug[];
}

export const featuredWorkIntro = todo('featured work intro', 16);

/** Featured work: the employer's case studies first, then personal projects, in content plan §6.4 order (FR-4). */
export const featuredWork: readonly WorkGroup[] = [
    {
        heading: todo('work group 1 heading'),
        subheading: todo('work group 1 subheading', 8),
        slugs: ['ai-assessment-integration', 'scheduling-platform', 'legacy-app-web-port', 'postgres-rls-multi-tenancy', 'client-intake-platform'],
    },
    {
        heading: todo('work group 2 heading'),
        subheading: todo('work group 2 subheading', 8),
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
