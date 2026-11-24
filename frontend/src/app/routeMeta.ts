import { caseStudies } from '../content/caseStudies';
import { caseStudyPath } from '../content/caseStudies/slugs';
import type { CaseStudy } from '../content/caseStudies/types';
import { profile } from '../content/profile';
import { site } from '../content/site';
import { t } from '../i18n/en';
import type { DocumentMeta } from './useDocumentMeta';

/** The title and description of the home page; `HomePage` and the prerender step read the same values (PF-009). */
export function homeMeta(): DocumentMeta {
    return { title: t('meta.homeTitle', { name: profile.name, title: profile.title }), description: site.homeDescription };
}

/** The title and description of one case study; `CaseStudyArticle` and the prerender step read the same values. */
export function caseStudyMeta(study: CaseStudy): DocumentMeta {
    return { title: t('meta.caseStudyTitle', { title: study.title, name: profile.name }), description: study.metaDescription };
}

/** Every route that gets its own prerendered HTML file: its path and the meta tags a link preview reads. */
export function prerenderedRoutes(): { path: string; meta: DocumentMeta }[] {
    return Object.values(caseStudies).map((study) => ({ path: caseStudyPath(study.slug), meta: caseStudyMeta(study) }));
}
