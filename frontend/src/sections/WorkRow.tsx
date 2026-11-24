import { Link } from 'react-router';
import { ChipList } from '../components/ChipList';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { caseStudyPath } from '../content/caseStudies/slugs';
import type { CaseStudy } from '../content/caseStudies/types';
import { t } from '../i18n/en';

/**
 * One Featured work row. The title link stretches over the whole row, so the row is one click target (AC-3).
 */
export function WorkRow({ study }: { study: CaseStudy }) {
    return (
        <li className='group relative -mx-3.5 grid gap-3.5 rounded-xl px-3.5 py-5.5 transition duration-200 before:absolute before:inset-x-3.5 before:top-0 before:h-px before:bg-line last:after:absolute last:after:inset-x-3.5 last:after:bottom-0 last:after:h-px last:after:bg-line hover:bg-surface-raised has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8'>
            <div>
                <h4 className='text-title font-bold'>
                    <Link
                        to={caseStudyPath(study.slug)}
                        className='text-ink no-underline after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none'
                        {...getTestIdProp(TestIds.work.caseStudyLink)}
                    >
                        {study.title}
                    </Link>
                </h4>
                <p className='mt-1.5 font-ui text-sm leading-snug text-muted'>{study.role}</p>
            </div>
            <div>
                <p className='text-body'>{study.problemLine}</p>
                <p className='mt-2 flex items-baseline gap-2 font-ui text-label font-semibold'>
                    <span aria-hidden='true' className='size-2 flex-none rounded-xs bg-status-ok' />
                    {study.outcomeLine}
                </p>
                <div className='mt-3.5 flex flex-wrap items-center justify-between gap-3'>
                    <ChipList items={study.chips} />
                    <span aria-hidden='true' className='font-ui text-sm font-semibold text-accent underline-offset-4 group-hover:underline'>
                        {t('work.readCaseStudy')}
                    </span>
                </div>
            </div>
        </li>
    );
}
