import { Section } from '../components/Section';
import { roles } from '../content/experience';
import { t } from '../i18n/en';

/** A timeline, newest first; the current role has a filled marker. */
export function Experience() {
    return (
        <Section id='experience' heading={t('experience.heading')}>
            <ol className='relative grid gap-7 pl-6 sm:gap-9 before:absolute before:top-2 before:bottom-2 before:left-1.25 before:w-0.5 before:bg-line'>
                {roles.map((role) => (
                    <li key={role.organization} className='reveal relative'>
                        <span
                            aria-hidden='true'
                            className={`absolute top-1.5 -left-6 size-3 rounded-full border-2 ${role.current ? 'border-accent bg-accent' : 'border-ink bg-surface'}`}
                        />
                        <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
                            <h3 className='text-title font-bold'>
                                {role.organization}
                                {role.current && <span className='sr-only'>, {t('experience.current')}</span>}
                            </h3>
                            <span className='font-ui text-sm text-muted'>{role.period}</span>
                        </div>
                        <p className='mt-0.5 font-ui text-label font-medium'>{role.title}</p>
                        <p className='mt-2 max-w-[60ch]'>{role.summary}</p>
                    </li>
                ))}
            </ol>
        </Section>
    );
}
