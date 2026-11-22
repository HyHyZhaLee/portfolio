import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

configure({ testIdAttribute: 'data-test-id' });

// A request without a handler fails the test instead of reaching the network. MSW 3 renamed onUnhandledRequest to onUnhandledFrame.
beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
    server.resetHandlers();
    cleanup();
});
afterAll(() => {
    server.close();
});
