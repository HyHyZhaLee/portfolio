import { Link } from 'react-router';
import { caseStudyMeta } from '../app/routeMeta';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { ChipList } from '../components/ChipList';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { caseStudies } from '../content/caseStudies';
import { caseStudyPath } from '../content/caseStudies/slugs';
import type { CaseStudy } from '../content/caseStudies/types';
import { nextInFeaturedOrder } from '../content/featuredWork';
import { t } from '../i18n/en';
import { GlanceAside } from './GlanceAside';

interface Block {
    heading: string;
    paragraphs?: readonly string[];
    points?: readonly string[];
}

/** One case study in the order of content plan §6.3, with its own title and meta description (FR-5, FR-6). */
export function CaseStudyArticle({ study }: { study: CaseStudy }) {
    useDocumentMeta(caseStudyMeta(study));
    const next = caseStudies[nextInFeaturedOrder(study.slug)];
    const blocks: Block[] = [
        { heading: t('caseStudy.context'), paragraphs: study.context },
        { heading: t('caseStudy.problem'), paragraphs: study.problem },
        { heading: t('caseStudy.roleAndScope'), paragraphs: study.roleAndScope },
        { heading: t('caseStudy.built'), points: study.built },
        ...(study.deepDive ? [{ heading: t('caseStudy.deepDive', { topic: study.deepDive.topic }), paragraphs: study.deepDive.paragraphs }] : []),
        { heading: t('caseStudy.outcome'), paragraphs: study.outcome },
        ...(study.learned ? [{ heading: t('caseStudy.learned'), paragraphs: study.learned }] : []),
    ];

    return (
        <article aria-labelledby='case-study-title'>
            <div className='wrap pt-9 pb-10'>
                <Link
                    to={{ pathname: '/', hash: '#work' }}
                    className='inline-flex items-center gap-1.5 font-ui text-label font-semibold'
                    {...getTestIdProp(TestIds.caseStudy.backLink)}
                >
                    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true' className='size-4'>
                        <path d='M12.5 4.5L7 10l5.5 5.5' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                    {t('caseStudy.back')}
                </Link>
                <h1 id='case-study-title' className='mt-5 max-w-[21ch] text-case font-extrabold'>
                    {study.title}
                </h1>
                <p className='mt-4 max-w-[46ch] text-lead'>{study.angle}</p>
            </div>
            <div className='wrap grid gap-10 pb-20 lg:grid-cols-[17rem_minmax(0,42rem)] lg:gap-18'>
                <GlanceAside study={study} />
                <div className='min-w-0'>
                    {blocks.map((block) => (
                        <div key={block.heading} className='not-first:mt-11'>
                            <h2 className='text-2xl font-bold tracking-tight'>{block.heading}</h2>
                            {block.paragraphs?.map((paragraph) => (
                                <p key={paragraph} className='mt-3.5 text-lg leading-relaxed'>
                                    {paragraph}
                                </p>
                            ))}
                            {block.points && (
                                <ul className='mt-3.5 grid gap-3'>
                                    {block.points.map((point) => (
                                        <li
                                            key={point}
                                            className='relative pl-5 text-body before:absolute before:top-[0.68em] before:left-0 before:h-0.5 before:w-2 before:bg-accent'
                                        >
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                    <div className='mt-11'>
                        <h2 className='text-2xl font-bold tracking-tight'>{t('caseStudy.tech')}</h2>
                        <ChipList items={study.tech} className='mt-3.5' />
                    </div>
                    <div className='mt-14 grid gap-1 border-t border-line pt-6'>
                        <span className='font-ui text-sm text-muted'>{t('caseStudy.next')}</span>
                        <Link
                            to={caseStudyPath(next.slug)}
                            className='font-ui text-xl font-bold text-ink no-underline hover:text-accent'
                            {...getTestIdProp(TestIds.caseStudy.nextLink)}
                        >
                            {next.title}
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
