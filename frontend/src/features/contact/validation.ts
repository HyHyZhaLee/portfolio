import { z } from 'zod';
import { t } from '../../i18n/en';

/** The server's limits (SITE-004, PF-028, `CreateContactMessageRequest`), mirrored so the client never relaxes one. */
export const CONTACT_LIMITS = {
    nameMax: 100,
    emailMax: 254,
    subjectMax: 150,
    messageMax: 10_000,
    websiteMax: 2048,
} as const;

/**
 * The server's character rule (PF-029 P5, `CreateContactMessageRequest`): no control character (C0, DEL, C1), line or
 * paragraph separator, or bidi mark, embedding, override, or isolate; the message also allows tab, line feed, and
 * carriage return. A failure shows the field's usual message.
 */
// eslint-disable-next-line no-control-regex -- the pattern exists to reject control characters
const SINGLE_LINE = /^[^\x00-\x1F\x7F-\x9F\u2028\u2029\u200E\u200F\u202A-\u202E\u2066-\u2069]*$/;
// eslint-disable-next-line no-control-regex -- the pattern exists to reject control characters
const MULTI_LINE = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u2028\u2029\u200E\u200F\u202A-\u202E\u2066-\u2069]*$/;

const nameError = t('contact.error.name');
const emailError = t('contact.error.email');
const subjectError = t('contact.error.subject');
const messageError = t('contact.error.message');

/**
 * The form's schema. Values are trimmed, so what is sent passes the server's `@NotBlank` and length checks; the
 * `website` honeypot is passed through unchanged.
 */
export const contactSchema = z.object({
    name: z.string().trim().min(1, nameError).max(CONTACT_LIMITS.nameMax, nameError).regex(SINGLE_LINE, nameError),
    email: z.string().trim().pipe(z.email(emailError).max(CONTACT_LIMITS.emailMax, emailError)),
    subject: z.string().trim().min(1, subjectError).max(CONTACT_LIMITS.subjectMax, subjectError).regex(SINGLE_LINE, subjectError),
    message: z.string().trim().min(1, messageError).max(CONTACT_LIMITS.messageMax, messageError).regex(MULTI_LINE, messageError),
    website: z.string().max(CONTACT_LIMITS.websiteMax),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
