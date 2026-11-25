import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';

/**
 * Marks a build that is not the live site. It renders only when `VITE_LIVE_SITE_URL` is set, which only Vercel's Preview
 * environment (staging) does, and links to that URL (PF-027 D18). Fixed at the bottom left, so the layout never shifts;
 * native dialogs sit above it in the top layer; hidden in print.
 */
export function StagingBadge() {
    const liveSiteUrl = import.meta.env.VITE_LIVE_SITE_URL;
    if (!liveSiteUrl) {
        return null;
    }
    return (
        <aside
            aria-label={t('app.staging.label')}
            className='fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-full border border-line bg-surface-raised px-4 py-1.5 font-ui text-sm text-ink shadow-md print:hidden'
            {...getTestIdProp(TestIds.app.stagingBadge)}
        >
            <span className='flex items-center gap-2 font-semibold'>
                <span aria-hidden='true' className='size-2 rounded-full bg-status-wake' />
                {t('app.staging.label')}
            </span>
            <a href={liveSiteUrl} className='touch-target' {...getTestIdProp(TestIds.app.liveSiteLink)}>
                {t('app.staging.liveLink')}
            </a>
        </aside>
    );
}
