import { useHealth } from './queries';
import type { ApiStatus } from './types';
import { useSlowAfter } from './useSlowAfter';

/** How long the check may wait before the panel says the API is waking up (FR-10). */
export const SLOW_AFTER_MS = 3000;

/**
 * Maps the shared health query to the panel's two status rows (F1 decision table). The first check, retries included,
 * reads `checking` and then `waking`; a re-check after a failure reads `waking` again, so a late wake turns the panel
 * green; a re-check after a success keeps the last answer until it settles (PF-022 D3, D6).
 */
export function useApiStatus(): ApiStatus {
    const { status, fetchStatus, data } = useHealth();
    const slow = useSlowAfter(status === 'pending', SLOW_AFTER_MS);
    if (status === 'pending') {
        return { api: slow ? 'waking' : 'checking', database: 'waiting' };
    }
    if (status === 'error') {
        return fetchStatus === 'fetching' ? { api: 'waking', database: 'waiting' } : { api: 'unreachable', database: 'unknown' };
    }
    return { api: 'online', database: data.databaseUp ? 'connected' : 'unavailable' };
}
