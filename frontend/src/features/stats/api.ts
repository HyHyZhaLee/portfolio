import { apiClient, CORRELATION_HEADER } from '../../api/client';
import { ApiError, UNEXPECTED_RESPONSE } from '../../api/errors';
import type { components } from '../../api/schema';

export type StatsSummary = components['schemas']['StatsSummaryResponse'];

/** Calls `GET /api/v1/stats/summary`. Throws `ApiError` for a problem response, no response, or a 2xx without a body. */
export async function getStatsSummary(signal?: AbortSignal): Promise<StatsSummary> {
    const { data, response } = await apiClient.GET('/api/v1/stats/summary', { signal });
    if (data === undefined) {
        throw new ApiError({ status: response.status, code: UNEXPECTED_RESPONSE, correlationId: response.headers.get(CORRELATION_HEADER) ?? undefined });
    }
    return data;
}
