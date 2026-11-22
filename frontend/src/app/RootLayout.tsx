import { Outlet } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';

export function RootLayout() {
    return (
        <>
            <a
                href='#main-content'
                className='sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink'
                {...getTestIdProp(TestIds.app.skipLink)}
            >
                {t('app.skipToContent')}
            </a>
            <main id='main-content' tabIndex={-1} className='mx-auto min-h-dvh max-w-5xl px-4 py-16 sm:px-6' {...getTestIdProp(TestIds.app.main)}>
                <Outlet />
            </main>
        </>
    );
}
