import type { CaseStudySlug } from '../caseStudies/slugs';
import { aiAssessmentIntegrationDiagram } from './ai-assessment-integration';
import { clientIntakePlatformDiagram } from './client-intake-platform';
import { legacyAppWebPortDiagram } from './legacy-app-web-port';
import { postgresRlsMultiTenancyDiagram } from './postgres-rls-multi-tenancy';
import { schedulingPlatformDiagram } from './scheduling-platform';
import { smartPoleDiagram } from './smart-pole';
import { thisSiteDiagram } from './this-site';
import type { ArchitectureDiagram } from './types';

/**
 * The architecture diagram of each case study that has one (PF-022 P2). A Tier B diagram is added only once the owner
 * approves it; a study without one renders as before.
 */
export const diagrams: Readonly<Partial<Record<CaseStudySlug, ArchitectureDiagram>>> = {
    'ai-assessment-integration': aiAssessmentIntegrationDiagram,
    'scheduling-platform': schedulingPlatformDiagram,
    'legacy-app-web-port': legacyAppWebPortDiagram,
    'postgres-rls-multi-tenancy': postgresRlsMultiTenancyDiagram,
    'client-intake-platform': clientIntakePlatformDiagram,
    'this-site': thisSiteDiagram,
    'smart-pole': smartPoleDiagram,
};

/** The diagram for a case study, or `undefined` when it has none. */
export function getDiagram(slug: CaseStudySlug): ArchitectureDiagram | undefined {
    return diagrams[slug];
}
