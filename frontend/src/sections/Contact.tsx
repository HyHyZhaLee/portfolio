import { Section } from '../components/Section';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { site } from '../content/site';
import { ContactForm } from '../features/contact';
import { t } from '../i18n/en';

const linkClass =
    'flex items-center gap-3 rounded-xl border border-line bg-surface-raised px-4 py-3.5 font-ui font-semibold text-ink no-underline hover:border-ink';

/**
 * The note and the LinkedIn and GitHub links first, since they work without the API, then the contact form (PF-006 P21);
 * at `xl` they sit side by side with the visual order equal to the DOM order (D13).
 */
export function Contact() {
    return (
        <Section id='contact' heading={t('contact.heading')}>
            <div className='grid gap-10 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-12'>
                <div className='grid max-w-xl content-start gap-5'>
                    <p className='font-ui text-label text-muted'>{site.contactNote}</p>
                    <ul className='grid gap-2'>
                        <li>
                            <a href={profile.links.linkedin} className={linkClass} {...getTestIdProp(TestIds.contact.linkedinLink)}>
                                {t('contact.linkedin')}
                            </a>
                        </li>
                        <li>
                            <a href={profile.links.github} className={linkClass} {...getTestIdProp(TestIds.contact.githubLink)}>
                                {t('contact.github')}
                                <span className='ml-auto text-sm font-normal text-muted'>{profile.links.github.replace('https://', '')}</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <ContactForm />
            </div>
        </Section>
    );
}
