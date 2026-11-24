/** Copy about the site itself: the home page's meta description, the contact note, and the footer's privacy note. */
export interface Site {
    homeDescription: string;
    contactNote: string;
    privacyNote: string;
}

export const site: Site = {
    homeDescription:
        'Will Ly is a full-stack software engineer building backend services, integrations and web apps for healthcare products. See case studies, skills and how he works.',
    contactNote: 'Want to talk about a role or a project? Send a message through the form, email me, or reach me on LinkedIn or GitHub.',
    // Matches the backend: a visit row holds a keyed hash (HMAC) of IP address and user agent, never the IP itself, and no cookie is set.
    privacyNote: 'Visits are counted anonymously: no cookies, and your IP address is never stored, only a keyed hash of it and your browser.',
};
