import { useQuery } from '@tanstack/react-query';
import { getStatsSummary } from './api';

export const statsKeys = {
    all: ['stats'] as const,
    summary: () => [...statsKeys.all, 'summary'] as const,
};

/** The visit totals, asked for only while `enabled` (the API is online, D2), with the default stale time and retry policy. */
export function useStatsSummary(enabled: boolean) {
    return useQuery({
        queryKey: statsKeys.summary(),
        queryFn: ({ signal }) => getStatsSummary(signal),
        enabled,
    });
}
