import { COLD_START_TIMEOUT_MS, CORRELATION_HEADER, createApiClient } from '../../api/client';
import { ApiError, UNEXPECTED_RESPONSE } from '../../api/errors';
import type { Health, HealthBody, LocalPaths } from './types';

// A 503 means the API answered and a component is down: its body is data, not an error (KNOWN-FE-006). One attempt
// may wait out a cold start of the free-tier API, up to the 100 s timeout (PF-003 P7, PF-023).
const healthClient = createApiClient<LocalPaths>({ tolerateStatus: [503], timeoutMs: COLD_START_TIMEOUT_MS });

function isHealthBody(value: unknown): value is HealthBody {
    return typeof value === 'object' && value !== null && typeof (value as { status?: unknown }).status === 'string';
}

/** Calls `GET /actuator/health` once. Throws `ApiError` when no health body arrives (`NETWORK_ERROR`, `UNEXPECTED_RESPONSE`). */
export async function getHealth(signal?: AbortSignal): Promise<Health> {
    const { data, error, response } = await healthClient.GET('/actuator/health', { signal });
    const body: unknown = data ?? error;
    if (!isHealthBody(body)) {
        throw new ApiError({ status: response.status, code: UNEXPECTED_RESPONSE, correlationId: response.headers.get(CORRELATION_HEADER) ?? undefined });
    }
    return { databaseUp: body.components?.db?.status === 'UP' };
}
