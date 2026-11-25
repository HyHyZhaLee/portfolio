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

const nameError = t('contact.error.name');
const emailError = t('contact.error.email');
const subjectError = t('contact.error.subject');
const messageError = t('contact.error.message');

/**
 * The form's schema. Values are trimmed, so what is sent passes the server's `@NotBlank` and length checks; the
 * `website` honeypot is passed through unchanged.
 */
export const contactSchema = z.object({
    name: z.string().trim().min(1, nameError).max(CONTACT_LIMITS.nameMax, nameError),
    email: z.string().trim().pipe(z.email(emailError).max(CONTACT_LIMITS.emailMax, emailError)),
    subject: z.string().trim().min(1, subjectError).max(CONTACT_LIMITS.subjectMax, subjectError),
    message: z.string().trim().min(1, messageError).max(CONTACT_LIMITS.messageMax, messageError),
    website: z.string().max(CONTACT_LIMITS.websiteMax),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
