/** The seven case studies, in Featured work order (content plan §6.4). Every reference to a case study uses this type. */
export const caseStudySlugs = [
    'ai-assessment-integration',
    'scheduling-platform',
    'legacy-app-web-port',
    'postgres-rls-multi-tenancy',
    'client-intake-platform',
    'this-site',
    'smart-pole',
] as const;

export type CaseStudySlug = (typeof caseStudySlugs)[number];

export function isCaseStudySlug(value: string): value is CaseStudySlug {
    return (caseStudySlugs as readonly string[]).includes(value);
}

/** The route of a case study. */
export function caseStudyPath(slug: CaseStudySlug): string {
    return `/work/${slug}`;
}
