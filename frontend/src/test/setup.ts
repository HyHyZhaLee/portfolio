import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

configure({ testIdAttribute: 'data-test-id' });

// jsdom implements neither scrolling API, and ScrollRestoration calls them after every navigation.
window.scrollTo = () => undefined;
Element.prototype.scrollIntoView = () => undefined;

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
