import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { renderWithProviders } from '../test/renderWithProviders';
import { Header } from './Header';

const sections = [
    { id: 'about', name: 'About' },
    { id: 'experience', name: 'Experience' },
    { id: 'work', name: 'Work' },
    { id: 'how-i-work', name: 'How I work' },
    { id: 'skills', name: 'Skills' },
    { id: 'contact', name: 'Contact' },
];

const menuButton = () => screen.getByTestId(TestIds.header.menuButton);
const dialog = () => screen.getByTestId(TestIds.header.menuDialog);
const inlineLinks = () => within(screen.getByRole('navigation', { name: 'Main' })).getAllByTestId(TestIds.header.navLink);
const menuLinks = () => within(dialog()).getAllByTestId(TestIds.header.navLink);
const linkNamed = (links: HTMLElement[], name: string): HTMLElement => {
    const link = links.find((item) => item.textContent === name);
    if (!link) throw new Error(`no ${name} link`);
    return link;
};

type ObserverCallback = (entries: { target: Element; isIntersecting: boolean }[]) => void;

let observerCallback: ObserverCallback | undefined;
const observed: Element[] = [];

class FakeIntersectionObserver {
    constructor(callback: ObserverCallback) {
        observerCallback = callback;
    }
    observe(element: Element) {
        observed.push(element);
    }
    disconnect() {
        observed.length = 0;
    }
}

function report(id: string, isIntersecting: boolean) {
    const target = observed.find((element) => element.id === id);
    if (!target || !observerCallback) throw new Error(`${id} is not observed`);
    const callback = observerCallback;
    act(() => {
        callback([{ target, isIntersecting }]);
    });
}

function stubObserverWithSections() {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    for (const { id } of sections) {
        const element = document.createElement('section');
        element.id = id;
        document.body.append(element);
    }
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    observerCallback = undefined;
    observed.length = 0;
    for (const { id } of sections) document.getElementById(id)?.remove();
});

describe('Header', () => {
    it('shows "Portfolio" as the home link, with the name for screen readers, since the hero carries the name', () => {
        renderWithProviders(<Header />);

        const home = screen.getByTestId(TestIds.header.homeLink);
        expect(home).toHaveTextContent('Portfolio');
        expect(home).toHaveAccessibleName('Will Ly portfolio, home');
        expect(home).toHaveAttribute('href', '/');
    });

    it('shows the deployed version beside the brand, linked to its release', () => {
        vi.stubEnv('VITE_APP_VERSION', 'v1.0.0');
        renderWithProviders(<Header />);

        const version = screen.getByTestId(TestIds.header.version);
        expect(version).toHaveTextContent('v1.0.0');
        expect(version).toHaveAccessibleName('Version v1.0.0: see what changed');
        expect(version).toHaveAttribute('href', `${profile.links.repository}/releases/tag/v1.0.0`);
    });

    it('shows no version in a build without one', () => {
        vi.stubEnv('VITE_APP_VERSION', '');
        renderWithProviders(<Header />);

        expect(screen.queryByTestId(TestIds.header.version)).not.toBeInTheDocument();
    });

    it('renders an inline nav with the six section links and an accessible name, and the same links in the menu', () => {
        renderWithProviders(<Header />);

        expect(inlineLinks().map((link) => link.getAttribute('href'))).toEqual(sections.map(({ id }) => `/#${id}`));
        expect(menuLinks()).toHaveLength(6);
        expect(screen.getAllByTestId(TestIds.header.navLink)).toHaveLength(12);
    });

    it('opens the menu dialog with the six section links and wires the button to it', async () => {
        renderWithProviders(<Header />);
        expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
        expect(dialog()).not.toHaveAttribute('open');

        await userEvent.click(menuButton());

        expect(dialog()).toHaveAttribute('open');
        expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
        expect(menuButton()).toHaveAttribute('aria-haspopup', 'dialog');
        expect(menuButton()).toHaveAttribute('aria-controls', dialog().id);
        expect(menuLinks().map((link) => link.getAttribute('href'))).toEqual(sections.map(({ id }) => `/#${id}`));
    });

    it.each([
        ['the close button', () => screen.getByTestId(TestIds.header.closeButton)],
        ['a link inside it', () => linkNamed(menuLinks(), 'Skills')],
        ['the dialog element itself (the backdrop)', () => dialog()],
    ])('closes the menu from %s', async (_label, target) => {
        renderWithProviders(<Header />);
        await userEvent.click(menuButton());
        expect(dialog()).toHaveAttribute('open');

        await userEvent.click(target());

        expect(dialog()).not.toHaveAttribute('open');
        expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the menu when the viewport grows to the inline nav width', async () => {
        let onChange: ((event: { matches: boolean }) => void) | undefined;
        vi.stubGlobal('matchMedia', () => ({
            addEventListener: (_type: string, listener: typeof onChange) => {
                onChange = listener;
            },
            removeEventListener: () => undefined,
        }));
        renderWithProviders(<Header />);
        await userEvent.click(menuButton());
        const listener = onChange;
        if (!listener) throw new Error('no change listener registered');

        act(() => {
            listener({ matches: true });
        });

        expect(dialog()).not.toHaveAttribute('open');
        expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('marks the section in view as the current location in the inline nav and the menu', () => {
        stubObserverWithSections();
        renderWithProviders(<Header />);

        report('work', true);
        for (const links of [inlineLinks(), menuLinks()]) {
            for (const link of links) {
                if (link.textContent === 'Work') expect(link).toHaveAttribute('aria-current', 'location');
                else expect(link).not.toHaveAttribute('aria-current');
            }
        }

        report('work', false);
        report('skills', true);
        expect(linkNamed(inlineLinks(), 'Skills')).toHaveAttribute('aria-current', 'location');
        expect(linkNamed(menuLinks(), 'Skills')).toHaveAttribute('aria-current', 'location');
        expect(linkNamed(inlineLinks(), 'Work')).not.toHaveAttribute('aria-current');
    });

    it('marks no link on a case study page', () => {
        stubObserverWithSections();
        renderWithProviders(<Header />, { route: '/work/legacy-app-web-port' });

        expect(observerCallback).toBeUndefined();
        for (const link of screen.getAllByTestId(TestIds.header.navLink)) expect(link).not.toHaveAttribute('aria-current');
    });

    it('marks no link where IntersectionObserver is missing', () => {
        renderWithProviders(<Header />);

        for (const link of screen.getAllByTestId(TestIds.header.navLink)) expect(link).not.toHaveAttribute('aria-current');
    });
});
