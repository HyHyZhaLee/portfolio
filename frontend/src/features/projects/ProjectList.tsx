import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { fallbackRepos } from '../../content/fallbackRepos';
import { t, type MessageKey } from '../../i18n/en';
import { SLOW_AFTER_MS, useApiStatus, useSlowAfter } from '../api-status';
import type { Project } from './api';
import { useProjects } from './queries';
import type { ProjectListState, RepoCardData } from './types';
import { RepoCard } from './RepoCard';

/** As many cards as the fallback list holds, so every state shows the same number (PF-007 D2, D3). */
export const MAX_PROJECTS = 6;

const notes: Record<ProjectListState, MessageKey | null> = {
    loading: null,
    waking: 'projects.waking',
    live: 'projects.live',
    fallback: 'projects.fallback',
};

function toCard(project: Project): RepoCardData {
    return { name: project.name, url: project.url, description: project.description, language: project.language, stars: project.stars };
}

/**
 * The Open source list (PF-007 F2). It shows the static repositories at once, asks for live ones only once the shared
 * health check says the API is online (D4), shows the cold-start hint after 3 s of waiting, and swaps in the first six
 * live repositories in place. An unreachable API, a failed request, or an empty list keeps the static ones (FR-9).
 */
export function ProjectList() {
    const { api } = useApiStatus();
    const projects = useProjects(api === 'online');
    const waiting = api === 'checking' || api === 'waking' || (api === 'online' && projects.isPending);
    const slow = useSlowAfter(waiting, SLOW_AFTER_MS);
    const live = projects.isSuccess && projects.data.length > 0;
    const state: ProjectListState = live ? 'live' : waiting ? (slow ? 'waking' : 'loading') : 'fallback';
    const repos: readonly RepoCardData[] = live ? projects.data.slice(0, MAX_PROJECTS).map(toCard) : fallbackRepos;
    const note = notes[state];

    return (
        <div>
            <p aria-live='polite' className='mb-4 min-h-5 font-ui text-sm text-muted' {...getTestIdProp(TestIds.projects.statusText)}>
                {note ? t(note) : null}
            </p>
            <ul aria-label={t('projects.listLabel')} className='grid gap-3 md:grid-cols-2'>
                {repos.map((repo) => (
                    <RepoCard key={repo.name} repo={repo} />
                ))}
            </ul>
        </div>
    );
}
