export interface Principle {
    title: string;
    /** The habit in a sentence or two; a principle whose text is not published yet has only its title. */
    body?: string;
    /** One example from real work; a principle whose example is not published has none. */
    example?: string;
}

export const howIWorkIntro = 'Five habits that shape how I build, with examples from my work.';

/** Working habits, each with a body and, where published, an example from real work (content plan §7.1). "Plan before code" returns once its text is approved. */
export const principles: readonly Principle[] = [
    {
        title: 'Find the root cause',
        body: 'When something breaks, I look for why before I change anything. A fix that only hides the symptom comes back, usually at a worse moment.',
        example: 'On the Frontera integration, I fixed a release-blocking issue where concurrent processing could drop clinical documents.',
    },
    {
        title: 'Design for failure',
        body: 'Networks fail and messages arrive twice. I build in retries, safe repeats and a way to recover, and I release risky changes behind feature flags so they can be switched off.',
        example:
            'The Frontera integration uses retries and circuit breakers, redelivery to dead-letter queues, a duplicate-safe event history and manual re-sync, so a failed sync is detected and recovered.',
    },
    {
        title: 'Test as part of the feature',
        body: 'Tests are not a separate phase. I write them with the code, run them in CI, and add a gate so coverage cannot quietly slip back.',
        example: 'On the TPMA/DCA web port I raised unit-test coverage from ~20% to 82% and added an 80% coverage gate in GitLab CI.',
    },
    {
        title: 'AI-assisted, human-verified',
        body: 'Uses AI coding assistants such as Claude Code to accelerate development, while reviewing and verifying every change.',
    },
    {
        title: 'Talk to people directly',
        body: 'Most problems are cheaper to settle in a short conversation than in a long ticket thread. I ask QA, product and DevOps early and often.',
        example: 'On the Frontera integration I worked directly with the QA, product and DevOps teams through testing, UAT and the v1.0.0 release.',
    },
];
