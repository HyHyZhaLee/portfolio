import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router';
import { useModalDialog } from '../components/useModalDialog';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';
import { navItems } from './navItems';

/** The size of the menu and close buttons: the same box, so the hamburger turns into the cross in place. */
const iconButtonClass = 'touch-target -mr-2.5 grid size-11 place-items-center rounded-control text-ink hover:text-accent';

/**
 * The phone and tablet navigation: an icon button and the modal dialog it opens, which repeats the header row and lists
 * the section links (PF-015 P1). It closes on a link, Escape, the backdrop, the close button, and a viewport of 1024px.
 */
export function MobileMenu({ active }: { active: string | null }) {
    const { isOpen, open, close, dialogRef, dialogProps } = useModalDialog();
    const dialogId = useId();
    const firstLinkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (!isOpen || typeof window.matchMedia !== 'function') {
            return undefined;
        }
        const query = window.matchMedia('(width >= 64rem)');
        const onChange = (event: MediaQueryListEvent) => {
            if (event.matches) {
                close();
            }
        };
        query.addEventListener('change', onChange);
        return () => {
            query.removeEventListener('change', onChange);
        };
    }, [isOpen, close]);

    return (
        <>
            <button
                type='button'
                aria-label={t('nav.openMenu')}
                aria-expanded={isOpen}
                aria-haspopup='dialog'
                aria-controls={dialogId}
                onClick={() => {
                    open();
                    firstLinkRef.current?.focus();
                }}
                className={`${iconButtonClass} lg:hidden`}
                {...getTestIdProp(TestIds.header.menuButton)}
            >
                <svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
                    <path d='M4 7h16M4 12h16M4 17h16' />
                </svg>
            </button>
            <dialog
                id={dialogId}
                aria-label={t('nav.mobileLabel')}
                ref={dialogRef}
                {...dialogProps}
                className='menu-sheet m-0 max-h-dvh w-full max-w-none overflow-y-auto border-b border-line bg-surface-raised text-ink shadow-panel'
                {...getTestIdProp(TestIds.header.menuDialog)}
            >
                <div className='wrap flex h-16 items-center justify-between gap-4 short:h-12'>
                    <span className='font-ui text-lg font-extrabold tracking-tight text-ink'>{t('nav.brand')}</span>
                    <button
                        type='button'
                        aria-label={t('nav.closeMenu')}
                        onClick={close}
                        className={iconButtonClass}
                        {...getTestIdProp(TestIds.header.closeButton)}
                    >
                        <svg
                            viewBox='0 0 24 24'
                            width='24'
                            height='24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            aria-hidden='true'
                        >
                            <path d='M6 6l12 12M18 6L6 18' />
                        </svg>
                    </button>
                </div>
                <nav aria-label={t('nav.mobileLabel')} className='wrap border-t border-line pb-3'>
                    {navItems.map((item, index) => (
                        <Link
                            key={item.id}
                            ref={index === 0 ? firstLinkRef : undefined}
                            to={{ pathname: '/', hash: `#${item.id}` }}
                            onClick={close}
                            aria-current={active === item.id ? 'location' : undefined}
                            className='flex min-h-12 items-center border-b border-line py-2 font-medium text-ink no-underline last:border-b-0 aria-[current=location]:text-accent'
                            {...getTestIdProp(TestIds.header.navLink)}
                        >
                            {t(item.label)}
                        </Link>
                    ))}
                </nav>
            </dialog>
        </>
    );
}
