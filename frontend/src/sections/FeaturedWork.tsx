import { Section } from '../components/Section';
import { caseStudies } from '../content/caseStudies';
import type { CaseStudySlug } from '../content/caseStudies/slugs';
import { featuredWork, featuredWorkIntro } from '../content/featuredWork';
import { t } from '../i18n/en';
import { WorkRow } from './WorkRow';

interface FeaturedWorkProps {
    /** The case studies of the selected skill, or `null` when no skill is selected (P5). */
    highlighted: ReadonlySet<CaseStudySlug> | null;
}

export function FeaturedWork({ highlighted }: FeaturedWorkProps) {
    return (
        <Section id='work' heading={t('work.heading')} intro={featuredWorkIntro}>
            {featuredWork.map((group) => (
                <div key={group.heading} className='not-first:mt-13'>
                    <h3 className='text-xl font-bold'>{group.heading}</h3>
                    <p className='mt-1 font-ui text-label text-muted'>{group.subheading}</p>
                    <ul className='mt-4.5'>
                        {group.slugs.map((slug) => (
                            <WorkRow key={slug} study={caseStudies[slug]} highlighted={highlighted?.has(slug) ?? false} />
                        ))}
                    </ul>
                </div>
            ))}
        </Section>
    );
}
