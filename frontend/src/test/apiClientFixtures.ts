import { expect } from 'vitest';
import { ApiError } from '../api/errors';

// Fixtures for the API client tests. A one-endpoint contract in the shape openapi-typescript generates;
// the real contract has no endpoints until PF-005.
export interface TestPaths {
    '/api/v1/things': {
        parameters: { query?: never; header?: never; path?: never; cookie?: never };
        get: {
            parameters: { query?: never; header?: never; path?: never; cookie?: never };
            requestBody?: never;
            responses: {
                200: { headers: Record<string, unknown>; content: { 'application/json': { items: string[] } } };
                202: { headers: Record<string, unknown>; content?: never };
                503: { headers: Record<string, unknown>; content: { 'application/json': { status: string } } };
            };
        };
    };
}

export const BASE_URL = 'http://api.test';
export const THINGS_URL = `${BASE_URL}/api/v1/things`;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function rejection(promise: Promise<unknown>): Promise<ApiError> {
    const error = await promise.then(
        () => undefined,
        (reason: unknown) => reason,
    );
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
}
