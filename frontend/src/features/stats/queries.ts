import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getStatsSummary } from './api';

export const statsKeys = {
    all: ['stats'] as const,
    summary: (recordedViews: number) => [...statsKeys.all, 'summary', recordedViews] as const,
};

/**
 * The visit totals, asked for only while `enabled` (the API is online, D2), with the default stale time and retry policy.
 * The key carries how many views this page load has recorded, so each recorded view asks again and the counter includes
 * it; the previous totals stay on screen meanwhile (PF-022 D5).
 */
export function useStatsSummary(enabled: boolean, recordedViews: number) {
    return useQuery({
        queryKey: statsKeys.summary(recordedViews),
        queryFn: ({ signal }) => getStatsSummary(signal),
        enabled,
        placeholderData: keepPreviousData,
    });
}
