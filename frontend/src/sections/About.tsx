import { Section } from '../components/Section';
import { profile } from '../content/profile';
import { t } from '../i18n/en';

export function About() {
    return (
        <Section id='about' heading={t('about.heading')}>
            <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12'>
                <div className='max-w-[62ch] space-y-4 text-lg leading-relaxed'>
                    {profile.about.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
                <dl className='grid content-start gap-4.5'>
                    {profile.facts.map((fact) => (
                        <div key={fact.label}>
                            <dt className='font-ui text-caption text-muted'>{fact.label}</dt>
                            <dd className='mt-0.5 font-ui text-label font-medium'>{fact.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </Section>
    );
}
