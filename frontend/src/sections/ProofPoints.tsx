import { Link } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { caseStudyPath } from '../content/caseStudies/slugs';
import { profile } from '../content/profile';
import { t } from '../i18n/en';

/** The hero's three claims, each linking to the case study that backs it (FR-3). */
export function ProofPoints() {
    return (
        <ul aria-label={t('hero.proofLabel')} className='mt-5.5 grid gap-1'>
            {profile.proofPoints.map((proof) => (
                <li key={proof.slug}>
                    <Link
                        to={caseStudyPath(proof.slug)}
                        className='group grid gap-0.5 border-l-3 border-accent py-1 pl-3.5 text-ink no-underline'
                        {...getTestIdProp(TestIds.hero.proofLink)}
                    >
                        <span className='font-ui text-body leading-snug font-semibold underline-offset-4 group-hover:underline'>{proof.claim}</span>
                        <span className='font-ui text-caption text-muted'>{proof.where}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
