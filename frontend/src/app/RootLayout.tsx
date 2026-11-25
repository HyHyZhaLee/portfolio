import { Suspense } from 'react';
import { Outlet, ScrollRestoration, type Location } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { useApiStatus } from '../features/api-status';
import { useTrackPageView } from '../features/visits';
import { t } from '../i18n/en';
import { Footer } from '../sections/Footer';
import { Header } from '../sections/Header';
import { StagingBadge } from './StagingBadge';

/**
 * Every fresh page load (a URL typed or opened in a new tab, a reload) gets the location key `default`, so their saved
 * scroll positions would overwrite each other: a case study opened in a new tab after scrolling the home page opened that
 * far down. Fresh loads are keyed by path instead; in-app entries keep their own keys (PF-026 D11).
 */
const scrollKey = (location: Location) => (location.key === 'default' ? location.pathname : location.key);

/**
 * Skip link, sticky header, the page, the footer, and in staging builds the staging badge (PF-027). `ScrollRestoration` scrolls to the hash or to the top on navigation
 * (PF-003 P6). Each route opened sends one page view from production builds (PF-005 F2), once the health check has
 * answered (PF-023 D4). The page sits in a `Suspense` boundary that is already on screen, so while a lazy page such as
 * a case study loads, React keeps the current page visible during in-app navigation (router updates are transitions), and a
 * deep link shows the header and footer at once (PF-026 D1).
 */
export function RootLayout() {
    useTrackPageView(useApiStatus().api === 'online');
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
                <Suspense fallback={null}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
            <StagingBadge />
            <ScrollRestoration getKey={scrollKey} />
        </>
    );
}
