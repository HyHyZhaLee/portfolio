import { Section } from '../components/Section';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { ProjectList } from '../features/projects';
import { t } from '../i18n/en';

/** The owner's public repositories, live when the API answers (SITE-005), then a link to the GitHub profile (PF-007 P15). */
export function OpenSource() {
    return (
        <Section id='open-source' heading={t('openSource.heading')}>
            <ProjectList />
            <a
                href={profile.links.github}
                className='mt-5 inline-block font-ui text-sm font-semibold text-accent underline-offset-4 hover:underline'
                {...getTestIdProp(TestIds.openSource.profileLink)}
            >
                {t('openSource.profileLink')}
            </a>
        </Section>
    );
}
