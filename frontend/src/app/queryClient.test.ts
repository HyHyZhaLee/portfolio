import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR } from '../api/errors';
import { createQueryClient, shouldRetryQuery } from './queryClient';

describe('shouldRetryQuery', () => {
    it.each([
        { case: 'a 4xx problem', error: new ApiError({ status: 404, code: 'NOT_FOUND' }), failureCount: 0, expected: false },
        { case: 'a 5xx problem, first failure', error: new ApiError({ status: 503, code: 'UNEXPECTED_RESPONSE' }), failureCount: 0, expected: true },
        { case: 'no response, first failure', error: new ApiError({ status: 0, code: NETWORK_ERROR }), failureCount: 1, expected: true },
        { case: 'no response, retries used up', error: new ApiError({ status: 0, code: NETWORK_ERROR }), failureCount: 2, expected: false },
        { case: 'an unknown error', error: new Error('boom'), failureCount: 0, expected: true },
    ])('$case → $expected', ({ error, failureCount, expected }) => {
        expect(shouldRetryQuery(failureCount, error)).toBe(expected);
    });
});

describe('createQueryClient', () => {
    it('never retries mutations', () => {
        expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
    });
});
