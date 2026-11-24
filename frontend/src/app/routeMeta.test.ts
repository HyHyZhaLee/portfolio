import { describe, expect, it } from 'vitest';
import { caseStudies } from '../content/caseStudies';
import { caseStudySlugs } from '../content/caseStudies/slugs';
import { profile } from '../content/profile';
import { caseStudyMeta, homeMeta, prerenderedRoutes } from './routeMeta';

describe('routeMeta', () => {
    it('lists one route per case study, titled with the study and the owner name', () => {
        const routes = prerenderedRoutes();

        expect(routes.map((route) => route.path)).toEqual(caseStudySlugs.map((slug) => `/work/${slug}`));
        for (const route of routes) {
            expect(route.meta.title).toContain(profile.name);
            expect(route.meta.description.length).toBeGreaterThan(0);
        }
    });

    it('titles the home page with the name and the job title', () => {
        expect(homeMeta().title).toBe(`${profile.name} - ${profile.title}`);
    });

    it('takes the description of a case study from its content', () => {
        const study = caseStudies['this-site'];

        expect(caseStudyMeta(study).description).toBe(study.metaDescription);
    });
});
