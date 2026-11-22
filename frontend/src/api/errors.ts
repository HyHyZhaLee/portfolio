/** A field-level validation failure from a `VALIDATION_FAILED` problem response. */
export interface FieldError {
    field: string;
    message: string;
}

/** No response arrived: offline, DNS failure, CORS rejection, or the client timeout. */
export const NETWORK_ERROR = 'NETWORK_ERROR';
/** A non-2xx response that is not RFC 9457 problem JSON (such as a proxy's HTML error page), or a 2xx body that is not JSON. */
export const UNEXPECTED_RESPONSE = 'UNEXPECTED_RESPONSE';

interface ApiErrorInit {
    status: number;
    code: string;
    detail?: string | undefined;
    correlationId?: string | undefined;
    errors?: FieldError[];
}

/**
 * The only error type the API client throws. UI code branches on `code`, never on `message` or `detail`
 * (frontend/docs/ARCHITECTURE.md, principle 8). `status` is 0 when no response arrived.
 */
export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly detail: string | undefined;
    readonly correlationId: string | undefined;
    readonly errors: FieldError[];

    constructor({ status, code, detail, correlationId, errors = [] }: ApiErrorInit) {
        super(detail ?? code);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.detail = detail;
        this.correlationId = correlationId;
        this.errors = errors;
    }

    get isClientError(): boolean {
        return this.status >= 400 && this.status < 500;
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const optionalString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const isFieldError = (value: unknown): value is FieldError => isRecord(value) && typeof value.field === 'string' && typeof value.message === 'string';

/** Builds an `ApiError` from a non-2xx response, reading the problem body when there is one. */
export async function toApiError(response: Response, requestCorrelationId?: string): Promise<ApiError> {
    const headerCorrelationId = response.headers.get('X-Correlation-Id') ?? requestCorrelationId;
    const body: unknown = await response.json().catch(() => undefined);
    if (!isRecord(body) || typeof body.code !== 'string') {
        return new ApiError({ status: response.status, code: UNEXPECTED_RESPONSE, correlationId: headerCorrelationId });
    }
    return new ApiError({
        status: response.status,
        code: body.code,
        detail: optionalString(body.detail),
        correlationId: optionalString(body.correlationId) ?? headerCorrelationId,
        errors: Array.isArray(body.errors) ? body.errors.filter(isFieldError) : [],
    });
}
