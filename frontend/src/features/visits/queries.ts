import { useMutation, useMutationState } from '@tanstack/react-query';
import { recordVisit } from './api';

export const visitKeys = {
    all: ['visits'] as const,
    record: () => [...visitKeys.all, 'record'] as const,
};

/** Sends one page view. Never retried, and kept for the whole page load so `useVisitCounted` can read its outcome (P11). */
export function useRecordVisit() {
    return useMutation({
        mutationKey: visitKeys.record(),
        mutationFn: recordVisit,
        retry: false,
        gcTime: Infinity,
    });
}

/** True once any page view of this page load was recorded (202); a skipped, failed, or rate-limited view never counts (D3). */
export function useVisitCounted(): boolean {
    return useMutationState({ filters: { mutationKey: visitKeys.record(), status: 'success' } }).length > 0;
}
