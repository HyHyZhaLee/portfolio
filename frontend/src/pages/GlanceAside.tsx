import { ChipList } from '../components/ChipList';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import type { CaseStudy } from '../content/caseStudies/types';
import { t } from '../i18n/en';

const termClass = 'font-ui text-caption text-muted';
const valueClass = 'mt-0.5 font-ui text-label leading-snug font-medium';

/** "At a glance": role, period, team, stack, up to three outcomes, and links; sticky beside the article on desktop. */
export function GlanceAside({ study }: { study: CaseStudy }) {
    return (
        <aside
            aria-labelledby='glance-heading'
            className='grid content-start gap-4 rounded-panel border border-line bg-surface-raised p-5 lg:sticky lg:top-24 lg:self-start'
        >
            <h2 id='glance-heading' className='text-base font-bold'>
                {t('caseStudy.glance')}
            </h2>
            <dl className='grid gap-3.5'>
                <div>
                    <dt className={termClass}>{t('caseStudy.role')}</dt>
                    <dd className={valueClass}>{study.role}</dd>
                </div>
                <div>
                    <dt className={termClass}>{t('caseStudy.period')}</dt>
                    <dd className={valueClass}>{study.period}</dd>
                </div>
                <div>
                    <dt className={termClass}>{t('caseStudy.team')}</dt>
                    <dd className={valueClass}>{study.team}</dd>
                </div>
                <div>
                    <dt className={termClass}>{t('caseStudy.stack')}</dt>
                    <dd className='mt-1.5'>
                        <ChipList items={study.stack} />
                    </dd>
                </div>
                <div>
                    <dt className={termClass}>{t('caseStudy.outcomes')}</dt>
                    <dd>
                        <ul className='mt-1 grid gap-2'>
                            {study.outcomes.map((outcome) => (
                                <li key={outcome} className='flex items-baseline gap-2 font-ui text-label leading-snug font-medium'>
                                    <span aria-hidden='true' className='size-2 flex-none rounded-xs bg-status-ok' />
                                    {outcome}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
            </dl>
            {study.links.length > 0 && (
                <div className='grid gap-1.5 border-t border-line pt-3.5 font-ui text-label font-semibold'>
                    {study.links.map((link) => (
                        <a key={link.href} href={link.href} {...getTestIdProp(TestIds.caseStudy.glanceLink)}>
                            {link.label}
                        </a>
                    ))}
                </div>
            )}
        </aside>
    );
}
