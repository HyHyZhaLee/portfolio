import { Link } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';

/** Shown inside the layout when a page throws while rendering. It never shows the error itself. */
export function RouteErrorPage() {
    return (
        <section aria-labelledby='route-error-heading' className='wrap space-y-4 py-16'>
            <h1 id='route-error-heading' className='text-3xl font-bold tracking-tight'>
                {t('routeError.heading')}
            </h1>
            <p className='text-muted'>{t('routeError.body')}</p>
            <Link to='/' reloadDocument className='font-ui' {...getTestIdProp(TestIds.routeError.homeLink)}>
                {t('routeError.homeLink')}
            </Link>
        </section>
    );
}
