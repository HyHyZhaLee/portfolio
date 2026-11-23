import { useQuery } from '@tanstack/react-query';
import { getHealth } from './api';

export const apiStatusKeys = {
    all: ['api-status'] as const,
    health: () => [...apiStatusKeys.all, 'health'] as const,
};

/**
 * One health check per page load, shared by every caller: no retry, so the worst case is one wait of up to 75 s, and
 * never stale, so neither a second component nor a route change sends another request (FR-9, FR-10).
 */
export function useHealth() {
    return useQuery({
        queryKey: apiStatusKeys.health(),
        queryFn: ({ signal }) => getHealth(signal),
        retry: false,
        staleTime: Infinity,
    });
}
