import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { StagingBadge } from './StagingBadge';

describe('StagingBadge', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('renders nothing when the live site URL is unset', () => {
        vi.stubEnv('VITE_LIVE_SITE_URL', '');
        render(<StagingBadge />);

        expect(screen.queryByTestId(TestIds.app.stagingBadge)).not.toBeInTheDocument();
    });

    it('shows the badge and a link to the live site when the URL is set', () => {
        vi.stubEnv('VITE_LIVE_SITE_URL', 'https://live.example');
        render(<StagingBadge />);

        expect(screen.getByTestId(TestIds.app.stagingBadge)).toHaveTextContent('Staging');
        const link = screen.getByTestId(TestIds.app.liveSiteLink);
        expect(link).toHaveTextContent('Go to the live site');
        expect(link).toHaveAttribute('href', 'https://live.example');
    });
});
