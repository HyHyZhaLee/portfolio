import { lazy, Suspense } from 'react';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { site } from '../content/site';
import { t } from '../i18n/en';

// The form (react-hook-form and zod) loads as its own chunk so it stays off the critical path of the first paint (PF-009).
const ContactForm = lazy(() => import('../features/contact').then((module) => ({ default: module.ContactForm })));

const linkClass =
    'group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-raised px-4.5 py-3.5 font-ui text-ink no-underline transition-colors hover:border-ink';

/** `https://www.linkedin.com/in/x` reads as `linkedin.com/in/x`, and `mailto:a@b.c` as `a@b.c`. */
const displayUrl = (url: string) => url.replace(/^(mailto:|https:\/\/(www\.)?)/, '');

const profileLinks = [
    { href: `mailto:${profile.links.email}`, label: t('contact.email'), testId: TestIds.contact.emailLink },
    { href: profile.links.linkedin, label: t('contact.linkedin'), testId: TestIds.contact.linkedinLink },
    { href: profile.links.github, label: t('contact.github'), testId: TestIds.contact.githubLink },
] as const;

function ExternalIcon() {
    return (
        <svg aria-hidden='true' viewBox='0 0 16 16' className='size-4 shrink-0 text-muted transition-colors group-hover:text-ink'>
            <path d='M5 11 11 5M6 5h5v5' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

/**
 * The closing section: the note and the LinkedIn and GitHub links first, since they work without the API, then the
 * contact form in a raised card (PF-006 P21). On desktop they sit side by side at equal height, the links aligned with
 * the card's bottom edge, with the visual order equal to the DOM order (D13). Unlike the other sections, the heading leads the left column instead of a rail, so the form gets the width.
 */
export function Contact() {
    return (
        <section id='contact' aria-labelledby='contact-heading' className='border-t border-line py-16 lg:py-22'>
            <div className='wrap grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16'>
                <div className='flex flex-col gap-7 lg:justify-between'>
                    <div>
                        <h2 id='contact-heading' className='text-section font-bold'>
                            {t('contact.heading')}
                        </h2>
                        <p className='mt-3 max-w-[38ch] text-lead'>{site.contactNote}</p>
                    </div>
                    <ul aria-label={t('contact.linksLabel')} className='grid gap-2.5'>
                        {profileLinks.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} className={linkClass} {...getTestIdProp(link.testId)}>
                                    <span className='grid'>
                                        <span className='font-semibold'>{link.label}</span>
                                        <span className='text-sm text-muted'>{displayUrl(link.href)}</span>
                                    </span>
                                    <ExternalIcon />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className='rounded-panel border border-line bg-surface-raised p-5 shadow-panel sm:p-7'>
                    <Suspense fallback={<div aria-hidden className='min-h-[28rem]' />}>
                        <ContactForm />
                    </Suspense>
                </div>
            </div>
        </section>
    );
}
