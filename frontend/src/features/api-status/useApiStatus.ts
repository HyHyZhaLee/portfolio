import { useHealth } from './queries';
import type { ApiStatus } from './types';
import { useSlowAfter } from './useSlowAfter';

/** How long the check may wait before the panel says the API is waking up (FR-10). */
export const SLOW_AFTER_MS = 3000;

/** Maps the shared health query to the panel's two status rows (F1 decision table). */
export function useApiStatus(): ApiStatus {
    const { isPending, isSuccess, data } = useHealth();
    const slow = useSlowAfter(isPending, SLOW_AFTER_MS);
    if (isPending) {
        return { api: slow ? 'waking' : 'checking', database: 'waiting' };
    }
    if (!isSuccess) {
        return { api: 'unreachable', database: 'unknown' };
    }
    return { api: 'online', database: data.databaseUp ? 'connected' : 'unavailable' };
}
