import { todo } from './placeholder';

/** Copy about the site itself: the home page's meta description, the contact note, and the footer's privacy note. */
export interface Site {
    homeDescription: string;
    contactNote: string;
    privacyNote: string;
}

export const site: Site = {
    homeDescription: todo('home meta description', 25),
    contactNote: todo('contact note', 30),
    privacyNote: todo('privacy note', 14),
};
