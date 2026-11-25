import { appVersion, versionLink } from '../app/appVersion';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { site } from '../content/site';
import { ApiStatusDot } from '../features/api-status';
import { VisitCounter } from '../features/stats';
import { t } from '../i18n/en';

export function Footer() {
    const version = appVersion();
    return (
        <footer className='border-t border-line pt-9 pb-10 sm:pb-12 font-ui text-sm text-muted'>
            <div className='wrap'>
                <div className='grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8'>
                    <span>{t('footer.copyright', { year: new Date().getFullYear(), name: profile.name })}</span>
                    <div className='flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-center'>
                        <ApiStatusDot />
                        <VisitCounter />
                    </div>
                    <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
                        <a href={profile.links.repository} className='touch-target' {...getTestIdProp(TestIds.footer.sourceLink)}>
                            {t('footer.source')}
                        </a>
                        {version ? <Version version={version} /> : null}
                    </div>
                </div>
                <p className='mt-4'>{site.privacyNote}</p>
            </div>
        </footer>
    );
}

/** The deployed version, linked to its release notes, the changes since the last release, or its commit (PF-027 P16). */
function Version({ version }: { version: string }) {
    const href = versionLink(version, profile.links.repository);
    if (!href) {
        return (
            <span className='font-mono text-xs' {...getTestIdProp(TestIds.footer.version)}>
                {version}
            </span>
        );
    }
    return (
        <a href={href} aria-label={t('footer.version', { version })} className='touch-target font-mono text-xs' {...getTestIdProp(TestIds.footer.version)}>
            {version}
        </a>
    );
}
