import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { renderWithProviders } from '../test/renderWithProviders';
import { Footer } from './Footer';

describe('Footer', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('links the deployed version to its release', () => {
        vi.stubEnv('VITE_APP_VERSION', 'v1.0.0');
        renderWithProviders(<Footer />);

        const version = screen.getByTestId(TestIds.footer.version);
        expect(version).toHaveTextContent('v1.0.0');
        expect(version).toHaveAttribute('href', `${profile.links.repository}/releases/tag/v1.0.0`);
    });
});
