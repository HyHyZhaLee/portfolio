import { describe, expect, it } from 'vitest';
import { caseStudies } from './caseStudies';
import { caseStudySlugs, isCaseStudySlug } from './caseStudies/slugs';
import { degrees, awards } from './education';
import { roles } from './experience';
import { featuredOrder, featuredWork, featuredWorkIntro } from './featuredWork';
import { howIWorkIntro, principles } from './howIWork';
import { profile } from './profile';
import { site } from './site';
import { skillGroups, skillsIntro } from './skills';

function emptyStringPaths(value: unknown, path: string): string[] {
    if (typeof value === 'string') return value.trim() === '' ? [path] : [];
    if (Array.isArray(value)) return value.flatMap((item, index) => emptyStringPaths(item, `${path}[${index}]`));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => emptyStringPaths(item, `${path}.${key}`));
    return [];
}

describe('content shape', () => {
    it('references only known slugs', () => {
        const referenced = [
            ...profile.proofPoints.map((point) => point.slug),
            ...featuredOrder,
            ...skillGroups.flatMap((group) => group.skills.flatMap((skill) => skill.usedIn)),
        ];

        expect(referenced.length).toBeGreaterThan(0);
        expect(referenced.every(isCaseStudySlug)).toBe(true);
    });

    it('lists each case study once across the Featured work groups, in slug order', () => {
        expect(featuredWork.flatMap((group) => group.slugs)).toEqual([...caseStudySlugs]);
        expect(caseStudySlugs).toHaveLength(7);
    });

    it('keys each case study by its slug and keeps its lists within bounds', () => {
        expect(Object.keys(caseStudies).sort()).toEqual([...caseStudySlugs].sort());
        for (const [key, study] of Object.entries(caseStudies)) {
            expect(study.slug).toBe(key);
            expect(study.chips).toHaveLength(3);
            expect(study.outcomes.length).toBeGreaterThanOrEqual(1);
            expect(study.outcomes.length).toBeLessThanOrEqual(3);
            expect(study.built.length).toBeGreaterThanOrEqual(3);
            expect(study.built.length).toBeLessThanOrEqual(5);
        }
    });

    it('has the planned counts of proof points, principles, and roles', () => {
        expect(profile.proofPoints).toHaveLength(3);
        expect(principles).toHaveLength(6);
        expect(roles).toHaveLength(3);
        expect(roles.filter((role) => role.current)).toHaveLength(1);
    });

    it('has no empty or whitespace-only content string', () => {
        const content = {
            caseStudies,
            featuredWorkIntro,
            featuredWork,
            howIWorkIntro,
            principles,
            skillsIntro,
            skillGroups,
            roles,
            degrees,
            awards,
            profile,
            site,
        };

        expect(emptyStringPaths(content, 'content')).toEqual([]);
    });
});
