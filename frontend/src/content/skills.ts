import type { CaseStudySlug } from './caseStudies/slugs';

export interface Skill {
    name: string;
    /** The case studies that used this skill; selecting the skill lists and highlights them (FR-8). A skill with none is listed without a link. */
    usedIn: readonly CaseStudySlug[];
}

export interface SkillGroup {
    name: string;
    skills: readonly Skill[];
}

export const skillsIntro = 'The tools I use in my work. Select a skill to see the case studies that used it.';

const AI = 'ai-assessment-integration';
const SCHED = 'scheduling-platform';
const PORT = 'legacy-app-web-port';
const RLS = 'postgres-rls-multi-tenancy';
const INTAKE = 'client-intake-platform';
const SITE = 'this-site';
const POLE = 'smart-pole';

/** Groups as on the CV; each skill lists the case studies that used it. */
export const skillGroups: readonly SkillGroup[] = [
    {
        name: 'Programming',
        skills: [
            { name: 'Java 21', usedIn: [AI, SCHED, SITE] },
            { name: 'TypeScript / JavaScript', usedIn: [AI, SCHED, PORT, RLS, INTAKE, SITE] },
            { name: 'SQL', usedIn: [AI, SCHED, PORT, RLS, INTAKE, SITE] },
            { name: 'Python', usedIn: [POLE] },
            { name: 'C / C++', usedIn: [] },
        ],
    },
    {
        name: 'Backend',
        skills: [
            { name: 'Spring Boot (JPA / Hibernate, Security)', usedIn: [AI, SCHED, SITE] },
            { name: 'Netflix DGS (GraphQL)', usedIn: [SCHED] },
            { name: 'Node.js', usedIn: [PORT, RLS, INTAKE] },
            { name: 'NestJS', usedIn: [INTAKE] },
            { name: 'Express', usedIn: [PORT, RLS] },
            { name: 'Prisma', usedIn: [INTAKE] },
            { name: 'Sequelize', usedIn: [PORT, RLS] },
            { name: 'REST APIs', usedIn: [PORT, SITE] },
            { name: 'Quartz', usedIn: [SCHED] },
            { name: 'MapStruct', usedIn: [SCHED] },
            { name: 'Resilience4j', usedIn: [AI, SITE] },
        ],
    },
    {
        name: 'Frontend',
        skills: [
            { name: 'React', usedIn: [AI, SCHED, PORT, INTAKE, SITE] },
            { name: 'Vite', usedIn: [AI, SCHED, PORT, INTAKE, SITE] },
            { name: 'MUI (Material UI)', usedIn: [SCHED] },
            { name: 'Apollo Client', usedIn: [SCHED] },
            { name: 'Radix UI', usedIn: [AI, PORT, INTAKE] },
            { name: 'Tailwind CSS', usedIn: [INTAKE, SITE] },
            { name: 'React Hook Form', usedIn: [SITE] },
            { name: 'Zod', usedIn: [SCHED, SITE] },
        ],
    },
    {
        name: 'Cloud & Data',
        skills: [
            { name: 'AWS EventBridge', usedIn: [AI, INTAKE] },
            { name: 'AWS SQS / DLQ', usedIn: [AI] },
            { name: 'AWS Lambda', usedIn: [AI, INTAKE] },
            { name: 'AWS S3', usedIn: [AI] },
            { name: 'AWS Cognito', usedIn: [AI, INTAKE] },
            { name: 'PostgreSQL (JSONB, Row-Level Security, advisory and row locks)', usedIn: [AI, SCHED, PORT, RLS, INTAKE, SITE] },
            { name: 'Flyway', usedIn: [SCHED, SITE] },
            { name: 'Liquibase', usedIn: [AI] },
        ],
    },
    {
        name: 'Testing',
        skills: [
            { name: 'JUnit 5', usedIn: [AI, SCHED, SITE] },
            { name: 'Mockito', usedIn: [AI, SCHED, SITE] },
            { name: 'Jest', usedIn: [AI, INTAKE] },
            { name: 'Vitest', usedIn: [AI, SCHED, PORT, SITE] },
            { name: 'Playwright', usedIn: [INTAKE] },
            { name: 'Cucumber (BDD)', usedIn: [INTAKE] },
        ],
    },
    {
        name: 'Tools',
        skills: [
            { name: 'GitLab CI/CD', usedIn: [AI, SCHED, PORT, INTAKE] },
            { name: 'Datadog', usedIn: [AI, SCHED] },
            { name: 'Claude Code (AI-assisted development)', usedIn: [AI, SCHED, PORT] },
        ],
    },
];
