import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { renderWithProviders } from '../test/renderWithProviders';
import { Contact } from './Contact';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Contact', () => {
    it('mounts the form only once the card nears the viewport', async () => {
        let callback: ObserverCallback | undefined;
        const options: IntersectionObserverInit[] = [];
        class FakeIntersectionObserver {
            constructor(onChange: ObserverCallback, init: IntersectionObserverInit) {
                callback = onChange;
                options.push(init);
            }
            observe() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        }
        vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
        renderWithProviders(<Contact />);

        expect(screen.queryByTestId(TestIds.contact.form)).not.toBeInTheDocument();
        expect(options).toEqual([{ rootMargin: '0px 0px 100% 0px' }]);

        const notify = callback;
        if (!notify) throw new Error('no observer callback');
        act(() => {
            notify([{ isIntersecting: true }]);
        });

        expect(await screen.findByTestId(TestIds.contact.form)).toBeInTheDocument();
    });

    it('mounts the form at once where IntersectionObserver is missing', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        renderWithProviders(<Contact />);

        expect(await screen.findByTestId(TestIds.contact.form)).toBeInTheDocument();
    });
});
