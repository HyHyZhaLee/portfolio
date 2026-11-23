import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { ApiStatusDot, SystemPanel } from '.';

function renderPanelAndDot() {
    return renderWithProviders(
        <>
            <SystemPanel />
            <ApiStatusDot />
        </>,
    );
}

describe('SystemPanel and ApiStatusDot', () => {
    it('shows online and connected, and the footer dot says API online, for a healthy backend', async () => {
        renderPanelAndDot();

        expect(screen.getByTestId(TestIds.apiStatus.panel)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Online'));
        expect(screen.getByTestId(TestIds.apiStatus.databaseState)).toHaveTextContent('Connected');
        expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API online');
        expect(screen.getByTestId(TestIds.apiStatus.howBuiltLink)).toHaveAttribute('href', '/work/this-site');
    });

    it('shows unreachable and unknown, and the footer dot says API unreachable, when the API cannot be reached', async () => {
        server.use(http.get('*/actuator/health', () => HttpResponse.error()));

        renderPanelAndDot();

        await waitFor(() => expect(screen.getByTestId(TestIds.apiStatus.apiState)).toHaveTextContent('Unreachable'));
        expect(screen.getByTestId(TestIds.apiStatus.databaseState)).toHaveTextContent('Unknown');
        expect(screen.getByTestId(TestIds.apiStatus.footerState)).toHaveTextContent('API unreachable');
    });
});
