import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ApiError, NETWORK_ERROR } from '../../api/errors';
import { ErrorNote } from '../../components/ErrorNote';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { t } from '../../i18n/en';
import { useSendContactMessage } from './queries';
import { contactSchema, type ContactFormValues } from './validation';

type VisibleField = 'name' | 'email' | 'subject' | 'message';

const EMPTY: ContactFormValues = { name: '', email: '', subject: '', message: '', website: '' };
const fieldError: Record<VisibleField, string> = {
    name: t('contact.error.name'),
    email: t('contact.error.email'),
    subject: t('contact.error.subject'),
    message: t('contact.error.message'),
};
const FIELD_ORDER: readonly VisibleField[] = ['name', 'email', 'subject', 'message'];

const labelClass = 'font-ui text-label font-semibold text-ink';
const inputClass =
    'w-full rounded-control border border-line bg-surface-raised px-3.5 py-3 font-ui text-base text-ink aria-invalid:border-status-wake aria-invalid:border-2';
const errorClass = 'font-ui text-caption text-ink';
const buttonClass =
    'inline-flex items-center justify-center gap-2 rounded-control border-[1.5px] px-5 py-3.5 font-ui text-base leading-none font-semibold transition-colors';

/** The note shown for each failure `code` (PF-006 F3). */
function failureMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return t('contact.error.unexpected');
    }
    switch (error.code) {
        case 'VALIDATION_FAILED':
            return t('contact.error.invalid');
        case 'RATE_LIMITED':
            return t('contact.error.rateLimited');
        case NETWORK_ERROR:
            return t('contact.error.network');
        default:
            return t('contact.error.unexpected');
    }
}

/** Moves focus to the success note when it replaces the form, so keyboard and screen-reader users land on it. */
const focusOnMount = (node: HTMLElement | null) => {
    node?.focus();
};

/**
 * The contact form (PF-006 FR-12 to FR-14): zod checks the server's limits before anything is sent, the `website`
 * honeypot is hidden from people and assistive technology, and the send shows its pending, success, and failure states.
 */
export function ContactForm() {
    const mutation = useSendContactMessage();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        setFocus,
        formState: { errors },
    } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema), defaultValues: EMPTY });

    const onSubmit = handleSubmit((values) => {
        mutation.mutate(values, {
            onSuccess: () => {
                reset(EMPTY);
            },
            onError: (error) => {
                if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
                    const listed = new Set(error.errors.map(({ field }) => field));
                    const invalid = FIELD_ORDER.filter((field) => listed.has(field));
                    for (const field of invalid) {
                        setError(field, { type: 'server', message: fieldError[field] });
                    }
                    // Like a client-side error, focus moves to the first invalid field in form order.
                    if (invalid[0]) {
                        setFocus(invalid[0]);
                    }
                }
            },
        });
    });

    if (mutation.isSuccess) {
        return (
            <div
                ref={focusOnMount}
                role='status'
                tabIndex={-1}
                className='grid justify-items-start gap-3 font-ui'
                {...getTestIdProp(TestIds.contact.successRegion)}
            >
                <p className='text-title font-semibold text-ink'>{t('contact.form.success')}</p>
                <button
                    type='button'
                    onClick={() => {
                        mutation.reset();
                    }}
                    className={`${buttonClass} border-ink text-ink hover:bg-surface-sunk`}
                    {...getTestIdProp(TestIds.contact.anotherButton)}
                >
                    {t('contact.form.sendAnother')}
                </button>
            </div>
        );
    }

    const describedBy = (field: VisibleField) => (errors[field] ? `contact-${field}-error` : undefined);

    return (
        <form
            noValidate
            aria-labelledby='contact-form-heading'
            onSubmit={(event) => {
                void onSubmit(event);
            }}
            className='relative grid gap-5'
            {...getTestIdProp(TestIds.contact.form)}
        >
            <h3 id='contact-form-heading' className='text-title font-semibold'>
                {t('contact.form.heading')}
            </h3>
            <div className='grid gap-5 sm:grid-cols-2'>
                <div className='grid gap-1.5'>
                    <label htmlFor='contact-name' className={labelClass}>
                        {t('contact.form.name')}
                    </label>
                    <input
                        id='contact-name'
                        type='text'
                        autoComplete='name'
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={describedBy('name')}
                        className={inputClass}
                        {...register('name')}
                        {...getTestIdProp(TestIds.contact.nameInput)}
                    />
                    {errors.name && (
                        <p id='contact-name-error' className={errorClass}>
                            {errors.name.message}
                        </p>
                    )}
                </div>
                <div className='grid gap-1.5'>
                    <label htmlFor='contact-email' className={labelClass}>
                        {t('contact.form.email')}
                    </label>
                    <input
                        id='contact-email'
                        type='email'
                        autoComplete='email'
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={describedBy('email')}
                        className={inputClass}
                        {...register('email')}
                        {...getTestIdProp(TestIds.contact.emailInput)}
                    />
                    {errors.email && (
                        <p id='contact-email-error' className={errorClass}>
                            {errors.email.message}
                        </p>
                    )}
                </div>
            </div>
            <div className='grid gap-1.5'>
                <label htmlFor='contact-subject' className={labelClass}>
                    {t('contact.form.subject')}
                </label>
                <input
                    id='contact-subject'
                    type='text'
                    aria-invalid={errors.subject ? true : undefined}
                    aria-describedby={describedBy('subject')}
                    className={inputClass}
                    {...register('subject')}
                    {...getTestIdProp(TestIds.contact.subjectInput)}
                />
                {errors.subject && (
                    <p id='contact-subject-error' className={errorClass}>
                        {errors.subject.message}
                    </p>
                )}
            </div>
            <div className='grid gap-1.5'>
                <label htmlFor='contact-message' className={labelClass}>
                    {t('contact.form.message')}
                </label>
                <textarea
                    id='contact-message'
                    rows={5}
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={describedBy('message')}
                    className={`${inputClass} resize-y`}
                    {...register('message')}
                    {...getTestIdProp(TestIds.contact.messageInput)}
                />
                {errors.message && (
                    <p id='contact-message-error' className={errorClass}>
                        {errors.message.message}
                    </p>
                )}
            </div>
            {/* The honeypot (D17): off-screen rather than display: none, out of the tab order and the accessibility tree. */}
            <div aria-hidden='true' className='absolute top-0 -left-[10000px] h-px w-px overflow-hidden'>
                <label htmlFor='contact-website'>{t('contact.form.website')}</label>
                <input
                    id='contact-website'
                    type='text'
                    tabIndex={-1}
                    autoComplete='off'
                    {...register('website')}
                    {...getTestIdProp(TestIds.contact.websiteInput)}
                />
            </div>
            <div className='grid justify-items-start gap-3'>
                <button
                    type='submit'
                    disabled={mutation.isPending}
                    className={`${buttonClass} border-accent bg-accent text-accent-ink hover:bg-accent/85 disabled:cursor-wait disabled:opacity-70`}
                    {...getTestIdProp(TestIds.contact.submitButton)}
                >
                    {mutation.isPending ? t('contact.form.sending') : t('contact.form.submit')}
                </button>
                <div aria-live='polite' className='w-full empty:hidden'>
                    {mutation.isPending && (
                        <p className='font-ui text-caption text-muted' {...getTestIdProp(TestIds.contact.hintText)}>
                            {t('contact.form.coldStartHint')}
                        </p>
                    )}
                </div>
                {mutation.isError && <ErrorNote message={failureMessage(mutation.error)} error={mutation.error} />}
            </div>
        </form>
    );
}
