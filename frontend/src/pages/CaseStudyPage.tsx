import { useParams } from 'react-router';
import { getCaseStudy } from '../content/caseStudies';
import { CaseStudyArticle } from './CaseStudyArticle';
import { NotFoundPage } from './NotFoundPage';

/** `/work/:slug`: the case study for a known slug, the 404 page for anything else (FR-7). */
export function CaseStudyPage() {
    const { slug } = useParams();
    const study = getCaseStudy(slug);
    return study ? <CaseStudyArticle study={study} /> : <NotFoundPage />;
}
