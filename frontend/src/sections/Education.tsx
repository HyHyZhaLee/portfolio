import { Section } from '../components/Section';
import { awards, degrees, type EducationItem } from '../content/education';
import { t, type MessageKey } from '../i18n/en';

const groups: readonly { heading: MessageKey; items: readonly EducationItem[] }[] = [
    { heading: 'education.degrees', items: degrees },
    { heading: 'education.awards', items: awards },
];

export function Education() {
    return (
        <Section id='education' heading={t('education.heading')}>
            {groups.map((group) => (
                <div key={group.heading} className='not-first:mt-8'>
                    <h3 className='mb-2 text-body font-bold'>{t(group.heading)}</h3>
                    <ul>
                        {group.items.map((item) => (
                            <li
                                key={item.title}
                                className='grid gap-1 border-t border-line py-4 last:border-b md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8'
                            >
                                <h4 className='text-base leading-snug font-semibold'>{item.title}</h4>
                                <p>{item.detail}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </Section>
    );
}
