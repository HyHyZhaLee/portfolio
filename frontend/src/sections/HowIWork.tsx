import { Section } from '../components/Section';
import { howIWorkIntro, principles } from '../content/howIWork';
import { t } from '../i18n/en';

/**
 * The grid never leaves an empty cell. On desktop it has six tracks: a full row holds three principles of two tracks
 * each, and a short last row stretches its one or two principles across all six. On tablets, an odd last principle
 * spans both columns.
 */
function spanClass(index: number, count: number): string {
    const lastRow = count % 3;
    const inLastRow = lastRow > 0 && index >= count - lastRow;
    const desktop = !inLastRow ? 'xl:col-span-2' : lastRow === 2 ? 'xl:col-span-3' : 'xl:col-span-6';
    const tablet = index === count - 1 && count % 2 === 1 ? 'md:col-span-2' : '';
    return `${tablet} ${desktop}`;
}

export function HowIWork() {
    return (
        <Section id='how-i-work' heading={t('howIWork.heading')} intro={howIWorkIntro}>
            <div className='grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-6'>
                {principles.map((principle, index) => (
                    <article key={principle.title} className={`reveal ${spanClass(index, principles.length)}`}>
                        <h3 className='text-title font-bold'>{principle.title}</h3>
                        {principle.body && <p className='mt-2'>{principle.body}</p>}
                        {principle.example && <p className='mt-3 border-l-2 border-line pl-3.5 font-ui text-sm leading-snug text-muted'>{principle.example}</p>}
                    </article>
                ))}
            </div>
        </Section>
    );
}
