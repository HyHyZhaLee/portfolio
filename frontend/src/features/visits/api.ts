import { COLD_START_TIMEOUT_MS, createApiClient } from '../../api/client';
import type { components } from '../../api/schema';

export type RecordVisitBody = components['schemas']['RecordVisitRequest'];

// The first view after an idle period may wait out a cold start of the free-tier API, up to the 100 s timeout (PF-005 D8, PF-023).
const visitClient = createApiClient({ timeoutMs: COLD_START_TIMEOUT_MS });

/**
 * Posts one page view to `POST /api/v1/visits` (202, no body). `keepalive` lets a slow first request finish when the
 * visitor leaves. Throws `ApiError` for a problem response (`VALIDATION_FAILED`, `RATE_LIMITED`) or no response.
 */
export async function recordVisit(body: RecordVisitBody): Promise<void> {
    await visitClient.POST('/api/v1/visits', { body, keepalive: true });
}
