import { Link, useLocation } from 'react-router';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { t } from '../i18n/en';

export function NotFoundPage() {
    const { pathname } = useLocation();
    useDocumentMeta({ title: t('meta.notFoundTitle', { name: profile.name }), description: t('notFound.description') });
    return (
        <section aria-labelledby='not-found-heading' className='wrap space-y-4 py-16'>
            <h1 id='not-found-heading' className='text-3xl font-bold tracking-tight'>
                {t('notFound.heading')}
            </h1>
            <p className='text-muted'>{t('notFound.body', { path: pathname })}</p>
            <Link to='/' className='font-ui' {...getTestIdProp(TestIds.notFound.homeLink)}>
                {t('notFound.homeLink')}
            </Link>
        </section>
    );
}
