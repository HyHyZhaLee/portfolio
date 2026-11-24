import { queryOptions, useQuery } from '@tanstack/react-query';
import { getHealth } from './api';

export const apiStatusKeys = {
    all: ['api-status'] as const,
    health: () => [...apiStatusKeys.all, 'health'] as const,
};

/** The waits before the second and third attempt of a failed check: a dropped connection or a cold start can outlast one attempt (PF-023 D2). */
export const HEALTH_RETRY_DELAYS_MS = [3_000, 10_000] as const;
/** How often the check repeats while the tab is visible, and for how long after the page opened (PF-023 D3). */
export const HEALTH_RECHECK_MS = 60_000;
export const HEALTH_RECHECK_WINDOW_MS = 15 * 60_000;

/**
 * The page's one health check, which is also its wake signal: `AppProviders` starts it when the app starts, and the
 * panel and the footer share it (PF-023 D1). A failed attempt is retried after 3 s and then 10 s (D2). While the tab is
 * visible it repeats every 60 s for the first 15 minutes, and again when the visitor returns to the tab after more than
 * 60 s; a hidden tab never re-checks, so a forgotten tab cannot keep the free-tier API and database awake (D3).
 */
export const healthQueryOptions = queryOptions({
    queryKey: apiStatusKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
    retry: HEALTH_RETRY_DELAYS_MS.length,
    retryDelay: (failureCount) => (failureCount === 0 ? HEALTH_RETRY_DELAYS_MS[0] : HEALTH_RETRY_DELAYS_MS[1]),
    staleTime: HEALTH_RECHECK_MS,
    refetchInterval: () => (performance.now() < HEALTH_RECHECK_WINDOW_MS ? HEALTH_RECHECK_MS : false),
    refetchOnWindowFocus: true,
});

export function useHealth() {
    return useQuery(healthQueryOptions);
}
