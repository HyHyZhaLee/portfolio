import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { awards } from '../content/education';
import { renderWithProviders } from '../test/renderWithProviders';
import { Education } from './Education';

describe('Education', () => {
    it('offers a certificate for every award, and none for the degrees', () => {
        renderWithProviders(<Education />);

        const buttons = screen.getAllByTestId(TestIds.education.certificateButton);
        expect(buttons).toHaveLength(awards.filter((award) => award.certificate).length);
        expect(buttons.map((button) => button.textContent)).toEqual(awards.map((award) => `View certificate: ${award.title}`));
    });

    it('opens the certificate in a dialog, loading the image only then, and closes it', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Education />);
        const [award] = awards;
        if (!award?.certificate) throw new Error('content needs an award with a certificate');
        const [dialog] = screen.getAllByTestId(TestIds.education.certificateDialog);
        if (!dialog) throw new Error('no certificate dialog');

        expect(within(dialog).queryByRole('img', { hidden: true })).not.toBeInTheDocument();

        const [button] = screen.getAllByTestId(TestIds.education.certificateButton);
        if (!button) throw new Error('no certificate button');
        await user.click(button);

        expect(dialog).toHaveAttribute('open');
        expect(within(dialog).getByRole('heading', { name: award.title })).toBeInTheDocument();
        expect(within(dialog).getByRole('img', { name: award.certificate.alt })).toHaveAttribute('src', award.certificate.src);

        await user.click(within(dialog).getByTestId(TestIds.education.certificateClose));

        expect(dialog).not.toHaveAttribute('open');
        expect(within(dialog).queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });
});
