import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { t } from '../i18n/en';

/** Placeholder until PF-003 composes the sections. */
export function HomePage() {
    return (
        <section aria-labelledby='home-heading' className='space-y-3'>
            <h1 id='home-heading' className='text-4xl font-bold tracking-tight' {...getTestIdProp(TestIds.home.heading)}>
                {profile.name}
            </h1>
            <p className='text-xl text-muted'>{profile.title}</p>
            <p className='text-muted'>{t('home.underConstruction')}</p>
        </section>
    );
}
