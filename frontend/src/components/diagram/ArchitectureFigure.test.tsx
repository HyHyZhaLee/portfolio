import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import type { ArchitectureDiagram } from '../../content/diagrams/types';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ArchitectureFigure } from './ArchitectureFigure';

const diagram: ArchitectureDiagram = {
    title: 'Sample architecture',
    summary: 'A web app sends work to a worker through a queue.',
    description: 'The web app enqueues a job, the worker takes it, and replies to the web app.',
    ownership: 'I built the web app side.',
    width: 1200,
    height: 300,
    zones: [{ id: 'z', label: 'Backend', x: 300, y: 20, w: 850, h: 260 }],
    nodes: [
        { id: 'web', label: 'Web app', x: 40, y: 100, w: 200, h: 80, icon: { glyph: 'browser' }, mine: true },
        { id: 'queue', label: 'Queue', x: 450, y: 100, w: 200, h: 80, icon: { glyph: 'queue' } },
        { id: 'worker', label: 'Worker', x: 900, y: 100, w: 200, h: 80, icon: { glyph: 'server' } },
    ],
    edges: [
        { id: 'send', kind: 'main', from: { node: 'web', side: 'right' }, to: { node: 'queue', side: 'left' } },
        { id: 'take', kind: 'main', from: { node: 'queue', side: 'right' }, to: { node: 'worker', side: 'left' } },
        {
            id: 'reply',
            kind: 'return',
            from: { node: 'worker', side: 'bottom' },
            to: { node: 'web', side: 'bottom' },
            via: [
                { x: 1000, y: 240 },
                { x: 140, y: 240 },
            ],
        },
    ],
    steps: [
        { text: 'The web app sends a job.', edges: ['send'], badge: { x: 340, y: 90 } },
        { text: 'The worker takes the job.', edges: ['take'], badge: { x: 780, y: 90 } },
        { text: 'The worker replies.', edges: ['reply'], badge: { x: 560, y: 230 }, mine: true },
    ],
};

function groupsWith(testId: string, attr: 'data-active' | 'data-dim'): string[] {
    const idAttr = testId === TestIds.caseStudy.diagramNode ? 'data-node-id' : 'data-edge-id';
    return screen
        .getAllByTestId(testId)
        .filter((group) => group.getAttribute(attr) === 'true')
        .map((group) => group.getAttribute(idAttr) ?? '');
}

function expectNothingActive() {
    for (const id of [TestIds.caseStudy.diagramNode, TestIds.caseStudy.diagramEdge]) {
        for (const group of screen.getAllByTestId(id)) {
            expect(group).not.toHaveAttribute('data-active');
            expect(group).not.toHaveAttribute('data-dim');
        }
    }
}

function expectStepTwoActive() {
    expect(groupsWith(TestIds.caseStudy.diagramEdge, 'data-active')).toEqual(['take']);
    expect(groupsWith(TestIds.caseStudy.diagramNode, 'data-active').sort()).toEqual(['queue', 'worker']);
    expect(groupsWith(TestIds.caseStudy.diagramEdge, 'data-dim').sort()).toEqual(['reply', 'send']);
    expect(groupsWith(TestIds.caseStudy.diagramNode, 'data-dim')).toEqual(['web']);
}

describe('ArchitectureFigure', () => {
    it('renders the labelled figure, the titled drawing, and the steps in order', () => {
        renderWithProviders(<ArchitectureFigure diagram={diagram} />);

        expect(screen.getByTestId(TestIds.caseStudy.diagram)).toHaveAccessibleName('Architecture');
        expect(screen.getByRole('img', { name: diagram.title })).toBeInTheDocument();
        expect(screen.getByText(diagram.summary)).toBeInTheDocument();
        expect(screen.getByText(diagram.ownership)).toBeInTheDocument();
        const steps = screen.getAllByTestId(TestIds.caseStudy.diagramStep);
        expect(steps).toHaveLength(3);
        diagram.steps.forEach((step, index) => expect(steps[index]).toHaveTextContent(step.text));
        expectNothingActive();
    });

    it('previews a step on hover, pins it on click, and lets the pin win over hovering another step', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ArchitectureFigure diagram={diagram} />);
        const [first, second] = screen.getAllByTestId(TestIds.caseStudy.diagramStep);
        if (!first || !second) throw new Error('missing steps');

        await user.hover(second);
        expectStepTwoActive();

        await user.click(second);
        expect(second).toHaveAttribute('aria-pressed', 'true');
        await user.unhover(second);
        expectStepTwoActive();

        await user.hover(first);
        expectStepTwoActive();

        await user.click(second);
        expect(second).toHaveAttribute('aria-pressed', 'false');
        await user.unhover(first);
        fireEvent.blur(second);
        fireEvent.blur(first);
        expectNothingActive();
    });

    it('highlights a step that takes keyboard focus', async () => {
        const user = userEvent.setup();
        renderWithProviders(<ArchitectureFigure diagram={diagram} />);

        // The scrollable drawing frame takes focus first, so keyboard users can scroll it (P8); nothing is active yet.
        await user.tab();
        expectNothingActive();
        await user.tab();
        expect(groupsWith(TestIds.caseStudy.diagramEdge, 'data-active')).toEqual(['send']);
        await user.tab();
        expectStepTwoActive();
    });

    it('lists only the legend marks the diagram uses', () => {
        renderWithProviders(<ArchitectureFigure diagram={diagram} />);
        const legend = screen.getByTestId(TestIds.caseStudy.diagramLegend);

        expect(legend).toHaveTextContent('My part');
        expect(legend).toHaveTextContent('Main flow');
        expect(legend).toHaveTextContent('Return');
        expect(legend).not.toHaveTextContent('Failure path');
        expect(legend).not.toHaveTextContent('Can be switched off on its own');
        expect(legend).not.toHaveTextContent('Redelivered, then kept in a dead-letter queue');
    });
});
