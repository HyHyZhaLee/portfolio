import { describe, expect, it } from 'vitest';
import { caseStudies } from './caseStudies';
import { caseStudySlugs, isCaseStudySlug } from './caseStudies/slugs';
import { diagrams } from './diagrams';
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

const allContent = {
    caseStudies,
    diagrams,
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
        expect(principles).toHaveLength(5);
        expect(roles).toHaveLength(3);
        expect(roles.filter((role) => role.current)).toHaveLength(1);
    });

    it('keeps every architecture diagram internally consistent (PF-022)', () => {
        const entries = Object.entries(diagrams);
        expect(entries.length).toBeGreaterThan(0);
        for (const [slug, diagram] of entries) {
            expect(isCaseStudySlug(slug)).toBe(true);
            const zoneIds = diagram.zones.map((zone) => zone.id);
            const nodeIds = diagram.nodes.map((node) => node.id);
            const edgeIds = diagram.edges.map((edge) => edge.id);
            for (const ids of [zoneIds, nodeIds, edgeIds]) expect(new Set(ids).size).toBe(ids.length);
            for (const edge of diagram.edges) {
                expect(nodeIds).toContain(edge.from.node);
                expect(nodeIds).toContain(edge.to.node);
            }
            for (const step of diagram.steps) {
                // A step highlights at least one edge or node (Smart Pole's first step is the firmware alone).
                expect(step.edges.length + (step.nodes?.length ?? 0)).toBeGreaterThanOrEqual(1);
                for (const id of step.edges) expect(edgeIds).toContain(id);
                for (const id of step.nodes ?? []) expect(nodeIds).toContain(id);
            }
            const inside = (x: number, y: number, w = 0, h = 0) => x >= 0 && y >= 0 && x + w <= diagram.width && y + h <= diagram.height;
            for (const box of [...diagram.zones, ...diagram.nodes]) expect(inside(box.x, box.y, box.w, box.h)).toBe(true);
            for (const step of diagram.steps) expect(inside(step.badge.x, step.badge.y)).toBe(true);
        }
    });

    it('has no empty or whitespace-only content string', () => {
        expect(emptyStringPaths(allContent, 'content')).toEqual([]);
    });

    it('has no leftover placeholder text or placeholder link (PF-012)', () => {
        const serialized = JSON.stringify(allContent);

        expect(serialized).not.toContain('TODO:');
        expect(serialized).not.toContain('#todo-');
    });
});
