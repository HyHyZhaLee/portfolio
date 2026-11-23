import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { t } from '../../i18n/en';
import { formatCount } from '../../utils/format';
import type { RepoCardData } from './types';

function starsText(count: number): string {
    return count === 1 ? t('projects.starsOne') : t('projects.starsMany', { count: formatCount(count) });
}

/**
 * One repository. Every line keeps its height whatever it holds (one line for the name, two for the description, one for
 * the language and stars), so live data replacing the fallback never moves the page (PF-007 P14).
 */
export function RepoCard({ repo }: { repo: RepoCardData }) {
    return (
        <li className='relative grid min-w-0 gap-1.5 rounded-xl border border-line bg-surface-raised px-4.5 py-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent hover:border-ink'>
            <h3 className='truncate font-ui text-base font-bold'>
                <a
                    href={repo.url}
                    className='text-ink no-underline after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none'
                    {...getTestIdProp(TestIds.projects.repoLink)}
                >
                    {repo.name}
                </a>
            </h3>
            <p className='line-clamp-2 min-h-[2lh] text-sm text-muted'>{repo.description}</p>
            <p className='flex min-h-5 items-center gap-3 font-ui text-caption text-muted'>
                {repo.language && <span>{repo.language}</span>}
                {repo.stars ? <span>{starsText(repo.stars)}</span> : null}
            </p>
        </li>
    );
}
