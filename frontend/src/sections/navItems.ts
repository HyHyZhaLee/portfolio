import type { MessageKey } from '../i18n/en';

/**
 * The home page sections the header links to, in page order. The links work from any route (PF-003 P6); the inline nav,
 * the mobile menu, and the active-section highlight share this list (PF-015).
 */
export const navItems = [
    { id: 'about', label: 'nav.about' },
    { id: 'experience', label: 'nav.experience' },
    { id: 'work', label: 'nav.work' },
    { id: 'how-i-work', label: 'nav.howIWork' },
    { id: 'skills', label: 'nav.skills' },
    { id: 'contact', label: 'nav.contact' },
] as const satisfies readonly { id: string; label: MessageKey }[];

export type NavItem = (typeof navItems)[number];
export type NavId = NavItem['id'];
