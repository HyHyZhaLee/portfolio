import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { HEALTH_RETRY_DELAYS_MS } from '../features/api-status/queries';

/**
 * Advances fake timers in small steps. MSW answers through real promise turns, so one large jump would pass a retry's
 * wait before the failure that schedules it has even arrived.
 */
export async function advanceTimersInSteps(totalMs: number, stepMs = 250): Promise<void> {
    for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(stepMs);
        });
    }
}

/** Runs the failed health check's two retries (3 s, then 10 s) under fake timers, so a test reaches "unreachable" at once. */
export async function exhaustHealthRetries(): Promise<void> {
    await advanceTimersInSteps(HEALTH_RETRY_DELAYS_MS[0] + HEALTH_RETRY_DELAYS_MS[1] + 1000);
}
