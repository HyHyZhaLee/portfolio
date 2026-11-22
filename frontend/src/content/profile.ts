/**
 * Who the site is about. Name and title come from the product guide; PF-003 adds the reviewed pitch, proof points,
 * and links from the content pack.
 */
export interface Profile {
    name: string;
    title: string;
}

export const profile: Profile = {
    name: 'Will Ly',
    title: 'Full-stack Software Engineer',
};
