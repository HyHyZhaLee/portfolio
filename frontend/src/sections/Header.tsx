import { useState } from 'react';
import { Link } from 'react-router';
import { ButtonLink } from '../components/ButtonLink';
import { DownloadIcon } from '../components/DownloadIcon';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { t, type MessageKey } from '../i18n/en';

/** The home page anchors the navigation links to; they work from any route (PF-003 P6). */
const navItems = [
    { hash: '#work', label: 'nav.work' },
    { hash: '#how-i-work', label: 'nav.howIWork' },
    { hash: '#skills', label: 'nav.skills' },
    { hash: '#experience', label: 'nav.experience' },
    { hash: '#contact', label: 'nav.contact' },
] as const satisfies readonly { hash: string; label: MessageKey }[];

const MOBILE_NAV_ID = 'mobile-nav';

export function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <header className='sticky top-0 z-20 border-b border-line bg-surface/92 backdrop-blur-sm'>
            <div className='wrap flex h-16 items-center justify-between gap-4'>
                <Link to='/' className='font-ui text-lg font-extrabold tracking-tight text-ink no-underline' {...getTestIdProp(TestIds.header.homeLink)}>
                    {profile.name}
                </Link>
                <nav aria-label={t('nav.label')} className='hidden items-center gap-6 lg:flex'>
                    {navItems.map((item) => (
                        <Link
                            key={item.hash}
                            to={{ pathname: '/', hash: item.hash }}
                            className='text-label font-medium text-ink no-underline hover:text-accent'
                            {...getTestIdProp(TestIds.header.navLink)}
                        >
                            {t(item.label)}
                        </Link>
                    ))}
                </nav>
                <ButtonLink href={profile.cvPath} size='small' className='max-lg:hidden' {...getTestIdProp(TestIds.header.cvLink)}>
                    <DownloadIcon />
                    {t('nav.downloadCv')}
                </ButtonLink>
                <button
                    type='button'
                    aria-expanded={menuOpen}
                    aria-controls={menuOpen ? MOBILE_NAV_ID : undefined}
                    onClick={() => {
                        setMenuOpen((open) => !open);
                    }}
                    className='rounded-control border border-line px-3 py-1.5 text-label font-medium text-ink lg:hidden'
                    {...getTestIdProp(TestIds.header.menuButton)}
                >
                    {t('nav.menu')}
                </button>
            </div>
            {menuOpen && (
                <div className='wrap lg:hidden'>
                    <nav id={MOBILE_NAV_ID} aria-label={t('nav.mobileLabel')} className='border-t border-line pt-2 pb-4'>
                        {navItems.map((item) => (
                            <Link
                                key={item.hash}
                                to={{ pathname: '/', hash: item.hash }}
                                onClick={closeMenu}
                                className='block border-b border-line py-2.5 font-medium text-ink no-underline'
                                {...getTestIdProp(TestIds.header.navLink)}
                            >
                                {t(item.label)}
                            </Link>
                        ))}
                        <a
                            href={profile.cvPath}
                            onClick={closeMenu}
                            className='block border-b border-line py-2.5 font-medium text-ink no-underline'
                            {...getTestIdProp(TestIds.header.cvLink)}
                        >
                            {t('nav.downloadCvPdf')}
                        </a>
                    </nav>
                </div>
            )}
        </header>
    );
}
