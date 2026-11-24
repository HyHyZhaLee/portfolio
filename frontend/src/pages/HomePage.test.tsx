import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { caseStudies } from '../content/caseStudies';
import { caseStudyPath } from '../content/caseStudies/slugs';
import { featuredOrder } from '../content/featuredWork';
import { profile } from '../content/profile';
import { skillGroups } from '../content/skills';
import { server } from '../test/server';
import { renderRoute } from '../test/renderWithProviders';

// A skill with no case study renders as a plain label, not a button.
const allSkills = skillGroups.flatMap((group) => group.skills).filter((skill) => skill.usedIn.length > 0);
const multiSlugSkills = allSkills.filter((skill) => skill.usedIn.length >= 2);
const [skillA, skillB] = multiSlugSkills;
if (!skillA || !skillB) throw new Error('content needs two skills used in at least two case studies');

const sectionHeadings = ['About', 'Experience', 'Featured work', 'How I work', 'Skills', 'Education', 'Contact'];

function skillButton(name: string): HTMLElement {
    const index = allSkills.findIndex((skill) => skill.name === name);
    const button = screen.getAllByTestId(TestIds.skills.skillButton)[index];
    if (!button) throw new Error(`no button for skill ${name}`);
    return button;
}

describe('HomePage', () => {
    it('lists a skill without a case study as a plain label, not a button', () => {
        renderRoute('/');

        const unlinked = skillGroups.flatMap((group) => group.skills).filter((skill) => skill.usedIn.length === 0);
        expect(unlinked.length).toBeGreaterThan(0);
        for (const skill of unlinked) {
            expect(screen.getByText(skill.name)).toBeInTheDocument();
            expect(screen.getByText(skill.name).closest('button')).toBeNull();
        }
    });

    it('renders every section at once while the health check fails', () => {
        server.use(http.get('*/actuator/health', () => HttpResponse.error()));
        renderRoute('/');

        for (const heading of sectionHeadings) {
            expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
        }
    });

    it('links the Featured work rows to the case studies in order', () => {
        renderRoute('/');

        const links = screen.getAllByTestId(TestIds.work.caseStudyLink);
        expect(links.map((link) => link.getAttribute('href'))).toEqual(featuredOrder.map(caseStudyPath));
    });

    it('shows the portrait beside the name in the hero', () => {
        renderRoute('/');

        expect(screen.getByTestId(TestIds.hero.portrait)).toHaveAccessibleName(`Portrait of ${profile.name}`);
    });

    it('links the contact profiles', () => {
        renderRoute('/');

        expect(screen.getByTestId(TestIds.contact.emailLink)).toHaveAttribute('href', `mailto:${profile.links.email}`);
        expect(screen.getByTestId(TestIds.contact.linkedinLink)).toHaveAttribute('href', profile.links.linkedin);
        expect(screen.getByTestId(TestIds.contact.githubLink)).toHaveAttribute('href', profile.links.github);
    });

    it('selects a skill, lists its case studies without marking the work rows, clears, and moves the selection', async () => {
        const user = userEvent.setup();
        renderRoute('/');

        await user.click(skillButton(skillA.name));

        const used = screen.getAllByTestId(TestIds.skills.usedInLink);
        expect(used.map((link) => link.getAttribute('href'))).toEqual(skillA.usedIn.map(caseStudyPath));
        expect(used.map((link) => link.textContent)).toEqual(skillA.usedIn.map((slug) => caseStudies[slug].title));
        expect(document.querySelectorAll('[data-state="match"]')).toHaveLength(0);
        expect(skillButton(skillA.name)).toHaveAttribute('aria-pressed', 'true');

        await user.click(skillButton(skillA.name));

        expect(screen.queryAllByTestId(TestIds.skills.usedInLink)).toHaveLength(0);

        await user.click(skillButton(skillA.name));
        await user.click(skillButton(skillB.name));

        const buttons = screen.getAllByTestId(TestIds.skills.skillButton);
        expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
        expect(skillButton(skillB.name)).toHaveAttribute('aria-pressed', 'true');
        const moved = screen.getAllByTestId(TestIds.skills.usedInLink);
        expect(moved.map((link) => link.getAttribute('href'))).toEqual(skillB.usedIn.map(caseStudyPath));
        expect(within(document.body).getAllByTestId(TestIds.work.caseStudyLink)).toHaveLength(featuredOrder.length);
    });
});
