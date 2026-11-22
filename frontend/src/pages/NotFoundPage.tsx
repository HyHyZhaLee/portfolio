import { Link, useLocation } from 'react-router';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';

export function NotFoundPage() {
    const { pathname } = useLocation();
    return (
        <section aria-labelledby='not-found-heading' className='space-y-4'>
            <h1 id='not-found-heading' className='text-3xl font-bold tracking-tight'>
                {t('notFound.heading')}
            </h1>
            <p className='text-muted'>{t('notFound.body', { path: pathname })}</p>
            <Link to='/' className='text-accent underline underline-offset-4' {...getTestIdProp(TestIds.notFound.homeLink)}>
                {t('notFound.homeLink')}
            </Link>
        </section>
    );
}
