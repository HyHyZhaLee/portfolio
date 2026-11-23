/** What one card shows: a live repository, or a fallback entry, which has no language or stars. */
export interface RepoCardData {
    name: string;
    url: string;
    description?: string | null;
    language?: string | null;
    stars?: number;
}

/** What the list is showing (PF-007 F2). */
export type ProjectListState = 'loading' | 'waking' | 'live' | 'fallback';
