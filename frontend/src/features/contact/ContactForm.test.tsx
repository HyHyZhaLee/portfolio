import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../../config/test-ids.config';
import { renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { ContactForm } from './ContactForm';

const CONTACT = '*/api/v1/contact-messages';
const ids = TestIds.contact;

function problem(status: number, code: string, extra: Record<string, unknown> = {}) {
    return HttpResponse.json(
        { status, code, correlationId: 'problem-reference', ...extra },
        { status, headers: { 'Content-Type': 'application/problem+json', 'X-Correlation-Id': 'problem-reference' } },
    );
}

/** Records every posted body, answering with `answer`. */
function capture(answer: () => Response | Promise<Response> = () => new HttpResponse(null, { status: 202, headers: { 'X-Correlation-Id': 'ref-123' } })) {
    const bodies: unknown[] = [];
    server.use(
        http.post(CONTACT, async ({ request }) => {
            bodies.push(await request.json());
            return answer();
        }),
    );
    return bodies;
}

async function fillAndSend(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByTestId(ids.nameInput), 'Ada Example');
    await user.type(screen.getByTestId(ids.emailInput), 'visitor@example.com');
    await user.type(screen.getByTestId(ids.subjectInput), 'A backend role');
    await user.type(screen.getByTestId(ids.messageInput), 'Hi');
    await user.click(screen.getByTestId(ids.submitButton));
}

describe('ContactForm', () => {
    it('renders while the API is unreachable', () => {
        server.use(http.get('*/actuator/health', () => HttpResponse.error()));

        renderWithProviders(<ContactForm />);

        expect(screen.getByTestId(ids.form)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    });

    it('shows the four field errors and sends nothing when submitted empty', async () => {
        const bodies = capture();
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);

        await user.click(screen.getByTestId(ids.submitButton));

        expect(await screen.findByText('Enter your name, up to 100 characters.')).toBeInTheDocument();
        expect(screen.getByText('Enter a valid email address, up to 254 characters.')).toBeInTheDocument();
        expect(screen.getByText('Enter a subject, up to 150 characters.')).toBeInTheDocument();
        expect(screen.getByText('Write your message, up to 10,000 characters.')).toBeInTheDocument();
        expect(screen.getByTestId(ids.nameInput)).toHaveAttribute('aria-invalid', 'true');
        expect(bodies).toHaveLength(0);
    });

    it('sends the message, confirms it without a reference, and starts over on request', async () => {
        const bodies = capture();
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);

        await fillAndSend(user);

        const success = await screen.findByTestId(ids.successRegion);
        expect(success).toHaveTextContent('Message sent. Thanks for getting in touch.');
        expect(success).not.toHaveTextContent('ref-123');
        expect(bodies).toEqual([{ name: 'Ada Example', email: 'visitor@example.com', subject: 'A backend role', message: 'Hi', website: '' }]);

        await user.click(screen.getByTestId(ids.anotherButton));

        expect(screen.getByTestId(ids.nameInput)).toHaveValue('');
        expect(screen.getByTestId(ids.subjectInput)).toHaveValue('');
        expect(screen.getByTestId(ids.messageInput)).toHaveValue('');
    });

    it('marks the fields a VALIDATION_FAILED answer lists and shows the code and reference', async () => {
        capture(() =>
            problem(400, 'VALIDATION_FAILED', {
                errors: [
                    { field: 'message', message: 'must not contain control characters' },
                    { field: 'email', message: 'must be a well-formed email address' },
                ],
            }),
        );
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);

        await fillAndSend(user);

        expect(await screen.findByTestId(TestIds.errorNote.region)).toHaveTextContent('Some fields need attention.');
        expect(screen.getByTestId(TestIds.errorNote.codeText)).toHaveTextContent('VALIDATION_FAILED');
        expect(screen.getByTestId(TestIds.errorNote.referenceText)).toHaveTextContent('problem-reference');
        expect(screen.getByTestId(ids.emailInput)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByTestId(ids.messageInput)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByTestId(ids.emailInput)).toHaveFocus();
        expect(screen.getByTestId(ids.nameInput)).toHaveValue('Ada Example');
    });

    it.each([
        ['RATE_LIMITED', () => problem(429, 'RATE_LIMITED'), 'Please try again later, or reach me on LinkedIn.'],
        ['NETWORK_ERROR', () => HttpResponse.error(), 'The API did not answer'],
        ['any other code', () => problem(500, 'INTERNAL_ERROR'), 'Something went wrong while sending.'],
    ])('explains a %s failure', async (_code, answer, message) => {
        capture(answer);
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);

        await fillAndSend(user);

        expect(await screen.findByRole('alert')).toHaveTextContent(message);
    });

    it('disables the button and shows the cold-start hint while the send is pending', async () => {
        capture(async () => {
            await delay('infinite');
            return new HttpResponse(null, { status: 202 });
        });
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);

        await fillAndSend(user);

        await waitFor(() => expect(screen.getByTestId(ids.submitButton)).toBeDisabled());
        expect(screen.getByTestId(ids.submitButton)).toHaveTextContent('Sending…');
        expect(screen.getByTestId(ids.hintText)).toBeInTheDocument();
    });

    it('keeps the honeypot out of reach of people and assistive technology, and still sends it', async () => {
        const bodies = capture();
        const user = userEvent.setup();
        renderWithProviders(<ContactForm />);
        const honeypot = screen.getByTestId(ids.websiteInput);

        expect(honeypot).toHaveAttribute('tabIndex', '-1');
        expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
        expect(screen.queryByRole('textbox', { name: 'Website' })).not.toBeInTheDocument();

        await user.type(honeypot, 'https://spam.example');
        await fillAndSend(user);

        await screen.findByTestId(ids.successRegion);
        expect(bodies).toEqual([expect.objectContaining({ website: 'https://spam.example' })]);
    });
});
