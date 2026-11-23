import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { site } from '../content/site';
import { ApiStatusDot } from '../features/api-status';
import { VisitCounter } from '../features/stats';
import { t } from '../i18n/en';

export function Footer() {
    return (
        <footer className='border-t border-line pt-9 pb-12 font-ui text-sm text-muted'>
            <div className='wrap'>
                <div className='grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8'>
                    <span>{t('footer.copyright', { year: new Date().getFullYear(), name: profile.name })}</span>
                    <div className='flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-center'>
                        <ApiStatusDot />
                        <VisitCounter />
                    </div>
                    <a href={profile.links.repository} {...getTestIdProp(TestIds.footer.sourceLink)}>
                        {t('footer.source')}
                    </a>
                </div>
                <p className='mt-4'>{site.privacyNote}</p>
            </div>
        </footer>
    );
}
