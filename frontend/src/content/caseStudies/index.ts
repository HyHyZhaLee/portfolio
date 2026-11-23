import { aiAssessmentIntegration } from './ai-assessment-integration';
import { schedulingPlatform } from './scheduling-platform';
import { legacyAppWebPort } from './legacy-app-web-port';
import { postgresRlsMultiTenancy } from './postgres-rls-multi-tenancy';
import { clientIntakePlatform } from './client-intake-platform';
import { thisSite } from './this-site';
import { smartPole } from './smart-pole';
import { isCaseStudySlug, type CaseStudySlug } from './slugs';
import type { CaseStudy } from './types';

/** Every case study by slug; the `Record` type makes a missing study a compile error. */
export const caseStudies: Readonly<Record<CaseStudySlug, CaseStudy>> = {
    'ai-assessment-integration': aiAssessmentIntegration,
    'scheduling-platform': schedulingPlatform,
    'legacy-app-web-port': legacyAppWebPort,
    'postgres-rls-multi-tenancy': postgresRlsMultiTenancy,
    'client-intake-platform': clientIntakePlatform,
    'this-site': thisSite,
    'smart-pole': smartPole,
};

/** The case study for a route parameter, or `undefined` for an unknown slug (which renders the 404 page). */
export function getCaseStudy(slug: string | undefined): CaseStudy | undefined {
    return slug !== undefined && isCaseStudySlug(slug) ? caseStudies[slug] : undefined;
}
