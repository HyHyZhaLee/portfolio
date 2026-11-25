import { COLD_START_TIMEOUT_MS, createApiClient } from '../../api/client';
import type { components } from '../../api/schema';

export type ContactMessageBody = components['schemas']['CreateContactMessageRequest'];

// A message sent while the free-tier API sleeps may wait out a cold start, up to the 100 s timeout (PF-006 P18, PF-023).
const contactClient = createApiClient({ timeoutMs: COLD_START_TIMEOUT_MS });

/**
 * Posts one message to `POST /api/v1/contact-messages` (202, no body). Throws `ApiError` for a problem response
 * (`VALIDATION_FAILED`, `RATE_LIMITED`) or no response (`NETWORK_ERROR`).
 */
export async function sendContactMessage(body: ContactMessageBody): Promise<void> {
    await contactClient.POST('/api/v1/contact-messages', { body });
}
