import { Outlet, ScrollRestoration } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { useTrackPageView } from '../features/visits';
import { t } from '../i18n/en';
import { Footer } from '../sections/Footer';
import { Header } from '../sections/Header';

/**
 * Skip link, sticky header, the page, and the footer. `ScrollRestoration` scrolls to the hash or to the top on navigation
 * (PF-003 P6). Each route opened sends one page view from production builds (PF-005 F2).
 */
export function RootLayout() {
    useTrackPageView();
    return (
        <>
            <a
                href='#main-content'
                className='sr-only no-underline focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:rounded-control focus:bg-accent focus:px-3.5 focus:py-2 focus:font-ui focus:text-accent-ink'
                {...getTestIdProp(TestIds.app.skipLink)}
            >
                {t('app.skipToContent')}
            </a>
            <Header />
            <main id='main-content' tabIndex={-1} className='min-h-dvh outline-none' {...getTestIdProp(TestIds.app.main)}>
                <Outlet />
            </main>
            <Footer />
            <ScrollRestoration />
        </>
    );
}
