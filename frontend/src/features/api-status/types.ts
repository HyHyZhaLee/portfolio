/** The actuator health body. With `show-components: always` it lists each component's status, never its details. */
export interface HealthBody {
    status: string;
    components?: Record<string, { status?: string } | undefined>;
}

interface NoParameters {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
}

interface HealthResponse {
    headers: Record<string, unknown>;
    content: { 'application/json': HealthBody };
}

/** The health endpoint sits outside the OpenAPI contract, so its shape is declared here (KNOWN-FE-006). */
export interface LocalPaths {
    '/actuator/health': {
        parameters: NoParameters;
        get: {
            parameters: NoParameters;
            requestBody?: never;
            responses: { 200: HealthResponse; 503: HealthResponse };
        };
    };
}

/** What the site reads from a health answer: the API replied, and whether its database is up. */
export interface Health {
    databaseUp: boolean;
}

export type ApiState = 'checking' | 'waking' | 'online' | 'unreachable';
export type DatabaseState = 'waiting' | 'connected' | 'unavailable' | 'unknown';

export interface ApiStatus {
    api: ApiState;
    database: DatabaseState;
}
