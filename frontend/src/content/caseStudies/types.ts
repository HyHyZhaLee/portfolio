import type { CaseStudySlug } from './slugs';

export interface CaseStudyLink {
    label: string;
    href: string;
}

/**
 * One case study: its Featured work row and its page come from the same object, so the title, role, and chips never
 * drift apart (PF-003 P4). Paragraph fields are arrays so a section can hold more than one paragraph.
 */
export interface CaseStudy {
    slug: CaseStudySlug;
    title: string;
    metaDescription: string;
    /** The one-line angle under the page title. */
    angle: string;
    role: string;
    /** Featured work row: the one-line problem, one outcome, and three tech chips. */
    problemLine: string;
    outcomeLine: string;
    chips: readonly [string, string, string];
    /** At a glance. */
    period: string;
    team: string;
    stack: readonly string[];
    outcomes: readonly string[];
    links: readonly CaseStudyLink[];
    /** The page sections, in order (content plan §6.3). */
    context: readonly string[];
    problem: readonly string[];
    roleAndScope: readonly string[];
    built: readonly string[];
    /** Absent when the study has no published deep-dive paragraph; the page then skips the section. */
    deepDive?: { topic: string; paragraphs: readonly string[] };
    outcome: readonly string[];
    /** Absent when the study has no published lesson; the page then skips the section. */
    learned?: readonly string[];
    tech: readonly string[];
}
