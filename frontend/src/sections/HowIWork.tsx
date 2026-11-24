import { Section } from '../components/Section';
import { howIWorkIntro, principles } from '../content/howIWork';
import { t } from '../i18n/en';

export function HowIWork() {
    return (
        <Section id='how-i-work' heading={t('howIWork.heading')} intro={howIWorkIntro}>
            <div className='grid gap-x-10 gap-y-9 md:grid-cols-2 xl:grid-cols-3'>
                {principles.map((principle) => (
                    <article key={principle.title}>
                        <h3 className='text-title font-bold'>{principle.title}</h3>
                        {principle.body && <p className='mt-2'>{principle.body}</p>}
                        {principle.example && <p className='mt-3 border-l-2 border-line pl-3.5 font-ui text-sm leading-snug text-muted'>{principle.example}</p>}
                    </article>
                ))}
            </div>
        </Section>
    );
}
