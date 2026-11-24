import type { CaseStudy } from './types';

export const postgresRlsMultiTenancy: CaseStudy = {
    slug: 'postgres-rls-multi-tenancy',
    title: 'TPMA Multi-tenancy - PostgreSQL Row-Level Security',
    metaDescription:
        'How I implemented database-enforced tenant isolation with PostgreSQL Row-Level Security and a Sequelize connection hook, so each provider organization can only read and write its own records.',
    angle: 'Making the database itself enforce tenant isolation.',
    role: "Implemented under the tech lead's shared-schema strategy",
    problemLine: "Several provider organizations share one database, so each one's clinical records must stay invisible to the others.",
    outcomeLine: 'Tenant ownership on ~90 tables; shipped to production with TPMA/DCA 1.0.0 in July 2026.',
    chips: ['PostgreSQL Row-Level Security', 'Node.js and Express', 'Sequelize'],
    period: '02/2026 – 03/2026',
    team: "Implemented under the tech lead's shared-schema strategy; a teammate finished the production rollout.",
    stack: ['Node.js', 'TypeScript', 'Express', 'Sequelize', 'PostgreSQL'],
    outcomes: [
        'RLS policies deployed to UAT so each organization sees only its own records.',
        'Tenant ownership added to ~90 tables, with the first 20 backfilled and triggers that reject records saved for the wrong tenant.',
        'Shipped to production with the TPMA/DCA 1.0.0 release in July 2026.',
    ],
    links: [],
    context: [
        "TPMA/DCA 2.0 is the treatment-planning and session data-collection system for ABA-therapy providers. It serves several provider organizations, called tenants, from one shared PostgreSQL database. Each tenant's clinical records must stay invisible to the others.",
    ],
    problem: [
        'If isolation depends on every developer remembering a tenant filter in every query, one forgotten filter becomes a data leak. With 90-odd tables and many endpoints, that is a real risk. The tech lead chose a shared schema protected by Row-Level Security (RLS), so the database enforces the rule even when application code gets it wrong. My job was to make that strategy work.',
    ],
    roleAndScope: [
        "I implemented tenant isolation under the tech lead's shared-schema strategy and deployed it to UAT. The strategy itself was the tech lead's. I do not claim the original design. After I handed it over, a teammate finished the production rollout.",
    ],
    built: [
        'Row-Level Security policies. Each organization can only read and write its own records.',
        'Reversible migrations. They added tenant ownership to ~90 tables and backfilled the first 20, with database triggers that reject records saved for the wrong tenant.',
        "A Sequelize connection hook. In the Node.js/Express API, it applies the signed-in user's tenant to every database request.",
        'A controlled bypass for background jobs. A dedicated PostgreSQL role is allowed to skip tenant isolation.',
        'A feature-flag kill switch for the rollout, and a tenant-aware Salesforce appointment import.',
    ],
    deepDive: {
        topic: 'A deliberate bypass for background jobs',
        paragraphs: [
            'Background jobs have no signed-in user, so they use the bypass role. That is a deliberate hole, so it is a single named role instead of scattered exceptions.',
        ],
    },
    outcome: [
        'The first version was built and deployed to UAT, then handed over. It shipped to production in July 2026 with the TPMA/DCA 1.0.0 release, alongside the web port.',
    ],
    tech: ['Node.js', 'TypeScript', 'Express', 'Sequelize', 'PostgreSQL', 'Row-Level Security', 'PL/pgSQL triggers'],
};
