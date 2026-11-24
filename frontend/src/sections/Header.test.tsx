import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { renderWithProviders } from '../test/renderWithProviders';
import { Header } from './Header';

const sectionLinks = [
    { name: 'Experience', href: '/#experience' },
    { name: 'Work', href: '/#work' },
    { name: 'How I work', href: '/#how-i-work' },
    { name: 'Skills', href: '/#skills' },
    { name: 'Contact', href: '/#contact' },
];

function mobileNav(): HTMLElement | null {
    return screen.queryByRole('navigation', { name: 'Main menu' });
}

describe('Header', () => {
    it('shows "Portfolio" as the home link, with the name for screen readers, since the hero carries the name', () => {
        renderWithProviders(<Header />);

        const home = screen.getByTestId(TestIds.header.homeLink);
        expect(home).toHaveTextContent('Portfolio');
        expect(home).toHaveAccessibleName('Will Ly portfolio, home');
        expect(home).toHaveAttribute('href', '/');
    });

    it('starts with the mobile menu closed', () => {
        renderWithProviders(<Header />);

        expect(screen.getByTestId(TestIds.header.menuButton)).toHaveAttribute('aria-expanded', 'false');
        expect(mobileNav()).not.toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    });

    it('opens the mobile menu with the five section links and closes it again', async () => {
        renderWithProviders(<Header />);
        const button = screen.getByTestId(TestIds.header.menuButton);

        await userEvent.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'true');
        const nav = within(screen.getByRole('navigation', { name: 'Main menu' }));
        for (const { name, href } of sectionLinks) {
            expect(nav.getByRole('link', { name })).toHaveAttribute('href', href);
        }

        await userEvent.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(mobileNav()).not.toBeInTheDocument();
    });

    it('closes the mobile menu when a link inside it is clicked', async () => {
        renderWithProviders(<Header />);
        const button = screen.getByTestId(TestIds.header.menuButton);
        await userEvent.click(button);

        await userEvent.click(within(screen.getByRole('navigation', { name: 'Main menu' })).getByRole('link', { name: 'Skills' }));

        expect(mobileNav()).not.toBeInTheDocument();
        expect(button).toHaveAttribute('aria-expanded', 'false');
    });
});
