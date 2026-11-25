import { Link, useLocation } from 'react-router';
import { appVersion, versionLink } from '../app/appVersion';
import { useActiveSection } from '../app/useActiveSection';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { t } from '../i18n/en';
import { MobileMenu } from './MobileMenu';
import { navItems } from './navItems';

const navIds = navItems.map((item) => item.id);

/**
 * The site header, fixed to the top: the brand with the site's version, the section links from 1024px, and the menu
 * below it. Fixed rather than sticky, because Chromium scrolls the page each time focus lands on a sticky element inside
 * the scroll-padding band, so tabbing through the links made the page jump (PF-015). The spacer keeps its place in the flow.
 */
export function Header() {
    const { pathname } = useLocation();
    const active = useActiveSection(navIds, pathname === '/');
    const version = appVersion();

    return (
        <>
            <div aria-hidden='true' className='box-content h-16 border-b border-transparent short:h-12' />
            <header className='fixed inset-x-0 top-0 z-20 border-b border-line bg-surface/92 backdrop-blur-sm print:absolute'>
                <div className='wrap flex h-16 items-center justify-between gap-4 short:h-12'>
                    <div className='flex min-w-0 items-baseline gap-2'>
                        <Link
                            to='/'
                            aria-label={t('nav.home', { name: profile.name })}
                            className='touch-target font-ui text-lg font-extrabold tracking-tight text-ink no-underline'
                            {...getTestIdProp(TestIds.header.homeLink)}
                        >
                            {t('nav.brand')}
                        </Link>
                        <Version version={version} />
                    </div>
                    <nav aria-label={t('nav.label')} className='hidden items-center gap-6 lg:flex'>
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                to={{ pathname: '/', hash: `#${item.id}` }}
                                aria-current={active === item.id ? 'location' : undefined}
                                className='touch-target text-label font-medium text-ink no-underline underline-offset-8 hover:text-accent aria-[current=location]:text-accent aria-[current=location]:underline'
                                {...getTestIdProp(TestIds.header.navLink)}
                            >
                                {t(item.label)}
                            </Link>
                        ))}
                    </nav>
                    <MobileMenu active={active} />
                </div>
            </header>
        </>
    );
}

/**
 * The site's version beside the brand, linked to its release notes (PF-027 P16). The ellipsis sits on an inner span, so
 * on a very narrow screen the text shrinks without clipping the link's touch target.
 */
function Version({ version }: { version: string }) {
    const href = versionLink(version, profile.links.repository);
    const text = <span className='block truncate'>{version}</span>;
    if (!href) {
        return (
            <span className='min-w-0 font-mono text-xs text-muted' {...getTestIdProp(TestIds.header.version)}>
                {text}
            </span>
        );
    }
    return (
        <a
            href={href}
            aria-label={t('nav.version', { version })}
            className='touch-target min-w-0 font-mono text-xs text-muted no-underline hover:text-accent'
            {...getTestIdProp(TestIds.header.version)}
        >
            {text}
        </a>
    );
}
