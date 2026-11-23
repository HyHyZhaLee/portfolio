import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { StatusDot, type StatusTone } from '../../components/StatusDot';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { caseStudyPath } from '../../content/caseStudies/slugs';
import { t, type MessageKey } from '../../i18n/en';
import { apiTone, databaseTone } from './statusTone';
import type { ApiStatus } from './types';
import { useApiStatus } from './useApiStatus';

interface Row {
    key: string;
    name: MessageKey;
    what: MessageKey;
    icon: ReactNode;
    tone: StatusTone;
    label: string;
    testId?: string;
}

const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, className: 'size-5' } as const;

function noteFor({ api, database }: ApiStatus): MessageKey {
    if (api === 'online') {
        return database === 'connected' ? 'apiStatus.note.online' : 'apiStatus.note.databaseDown';
    }
    return `apiStatus.note.${api}`;
}

/**
 * "This page is a live full-stack app": the browser and the frontend are always up; the API and database rows come
 * from the one health check (F1). Fixed row heights and a reserved note height keep status changes from shifting the
 * layout, and the one-time pulse only runs when the visitor allows motion (FR-17).
 */
export function SystemPanel() {
    const status = useApiStatus();
    const rows: Row[] = [
        {
            key: 'browser',
            name: 'apiStatus.browserName',
            what: 'apiStatus.browserWhat',
            tone: 'ok',
            label: t('apiStatus.browserState'),
            icon: (
                <svg {...iconProps}>
                    <rect x='3' y='4.5' width='18' height='15' rx='2.5' />
                    <path d='M3 9h18' />
                </svg>
            ),
        },
        {
            key: 'frontend',
            name: 'apiStatus.frontendName',
            what: 'apiStatus.frontendWhat',
            tone: 'ok',
            label: t('apiStatus.frontendState'),
            icon: (
                <svg {...iconProps}>
                    <path d='M12 3.5l8.5 4.5L12 12.5 3.5 8 12 3.5z' />
                    <path d='M3.5 12L12 16.5 20.5 12' />
                    <path d='M3.5 16L12 20.5 20.5 16' />
                </svg>
            ),
        },
        {
            key: 'api',
            name: 'apiStatus.apiName',
            what: 'apiStatus.apiWhat',
            tone: apiTone[status.api],
            label: t(`apiStatus.api.${status.api}`),
            testId: TestIds.apiStatus.apiState,
            icon: (
                <svg {...iconProps}>
                    <rect x='4' y='4' width='16' height='6.5' rx='1.8' />
                    <rect x='4' y='13.5' width='16' height='6.5' rx='1.8' />
                    <path d='M7.5 7.25h.01M7.5 16.75h.01' strokeWidth='2.4' strokeLinecap='round' />
                </svg>
            ),
        },
        {
            key: 'database',
            name: 'apiStatus.databaseName',
            what: 'apiStatus.databaseWhat',
            tone: databaseTone[status.database],
            label: t(`apiStatus.database.${status.database}`),
            testId: TestIds.apiStatus.databaseState,
            icon: (
                <svg {...iconProps}>
                    <ellipse cx='12' cy='6' rx='7.5' ry='2.8' />
                    <path d='M4.5 6v12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6' />
                    <path d='M4.5 12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8' />
                </svg>
            ),
        },
    ];
    const answered = status.api === 'online' || status.api === 'unreachable';

    return (
        <aside
            aria-labelledby='system-title'
            className='rounded-panel border border-line bg-surface-raised px-5 pt-5 pb-4.5 shadow-panel'
            {...getTestIdProp(TestIds.apiStatus.panel)}
        >
            <div className='flex items-baseline justify-between gap-4'>
                <p id='system-title' className='font-ui font-semibold'>
                    {t('apiStatus.title')}
                </p>
                <p className='font-ui text-caption text-muted'>{t('apiStatus.subtitle')}</p>
            </div>
            <div className='relative mt-4'>
                <ol>
                    {rows.map((row, index) => (
                        <li key={row.key} className='relative grid h-18 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3'>
                            {index < rows.length - 1 && <span aria-hidden='true' className='absolute top-14 left-5 h-8 w-0.5 -translate-x-1/2 bg-line' />}
                            <span aria-hidden='true' className='grid size-10 place-items-center rounded-control border border-line bg-surface-sunk text-ink'>
                                {row.icon}
                            </span>
                            <div>
                                <p className='font-ui text-label leading-tight font-semibold'>{t(row.name)}</p>
                                <p className='font-ui text-caption text-muted'>{t(row.what)}</p>
                            </div>
                            <span
                                className='inline-flex items-center gap-1.5 font-ui text-caption font-semibold whitespace-nowrap text-ink'
                                {...(row.testId ? getTestIdProp(row.testId) : {})}
                            >
                                <StatusDot tone={row.tone} />
                                <span>{row.label}</span>
                            </span>
                        </li>
                    ))}
                </ol>
                <span
                    aria-hidden='true'
                    className='pointer-events-none absolute top-8 left-4 size-2 rounded-full bg-accent opacity-0 motion-safe:animate-travel motion-reduce:hidden'
                />
            </div>
            <p aria-live='polite' className='mt-3.5 min-h-14 border-t border-line pt-3.5 font-ui text-sm leading-snug text-muted'>
                {t(noteFor(status))}
                {answered && (
                    <>
                        {' '}
                        <Link to={caseStudyPath('this-site')} className='font-semibold' {...getTestIdProp(TestIds.apiStatus.howBuiltLink)}>
                            {t('apiStatus.howBuilt')}
                        </Link>
                    </>
                )}
            </p>
        </aside>
    );
}
