import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

configure({ testIdAttribute: 'data-test-id' });

// jsdom implements neither scrolling API, and ScrollRestoration calls them after every navigation.
window.scrollTo = () => undefined;
Element.prototype.scrollIntoView = () => undefined;

// jsdom has no modal dialog API; this stand-in toggles `open` and fires `close`, which is all the certificate viewer needs.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.open = true;
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
        if (this.open) {
            this.open = false;
            this.dispatchEvent(new Event('close'));
        }
    };
}

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
