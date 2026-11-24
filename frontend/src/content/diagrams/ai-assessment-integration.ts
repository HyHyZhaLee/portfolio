import type { ArchitectureDiagram } from './types';

/**
 * Frontera (PF-022 D-1, Tier B: topology and layers approved by the owner on 2026-11-24, corrected at the drawing's
 * review the same day: documents go through S3, there is no error queue, and the forwarded report passes a ClamAV
 * virus scan). Redrawn with only what a viewer needs: the core round trip, redelivery to dead-letter queues, and kill
 * switches. Outbound runs left to right along y = 200,
 * the return runs right to left along y = 440, the report is forwarded along the top, and the client's documents
 * travel along the bottom to the S3 bucket that Frontera reads.
 */
export const aiAssessmentIntegrationDiagram: ArchitectureDiagram = {
    title: 'Frontera integration architecture',
    summary: "How a new client's documents reach the partner AI platform, and how the report comes back for review.",
    description:
        "The Provider portal uploads the client's documents to an S3 bucket, and client and document events travel from the portal through an internal EventBridge bus, an enricher Lambda and an SQS queue to the MyBrightLink backend, which records each event once and publishes it to a partner EventBridge bus. An enricher Lambda fans the events out to one SQS queue per event type for Frontera. Frontera reads the documents from S3, drafts the report, stores the PDF in the same bucket, and sends the result back through the partner bus and an output Lambda to the internal queue. A clinician reviews the report in MyBrightLink, and it is scanned for viruses with ClamAV and forwarded to the Provider portal. Three hops can each be switched off on their own, and both queues redeliver failed events before keeping them in a dead-letter queue.",
    ownership: '★ The parts I implemented. The tech lead owned the design and event contracts; DevOps owned the AWS infrastructure.',
    width: 1200,
    height: 564,
    zones: [
        { id: 'provider', label: 'Provider systems', x: 12, y: 12, w: 150, h: 540 },
        { id: 'internal', label: 'Internal events', x: 170, y: 12, w: 320, h: 540, aws: true },
        { id: 'mybrightlink', label: 'MyBrightLink', x: 498, y: 12, w: 196, h: 540 },
        { id: 'partner', label: 'Partner events', x: 702, y: 12, w: 330, h: 540, aws: true },
        { id: 'ai', label: 'Partner AI platform', x: 1040, y: 12, w: 148, h: 540 },
    ],
    nodes: [
        { id: 'portal', label: 'Provider portal', x: 20, y: 174, w: 134, h: 52, icon: { glyph: 'browser' } },
        { id: 'crm', label: 'CRM', detail: 'Salesforce', x: 20, y: 304, w: 108, h: 56, icon: { glyph: 'external' } },
        { id: 'internal-bus', label: 'Internal event bus', x: 204, y: 178, w: 44, h: 44, icon: { aws: 'eventbridge' } },
        { id: 'enricher', label: 'Enricher', x: 308, y: 178, w: 44, h: 44, icon: { aws: 'lambda' }, mine: true },
        { id: 'internal-queue', label: 'Internal queue', x: 412, y: 178, w: 44, h: 44, icon: { aws: 'sqs' }, dlq: true },
        { id: 'virus-scan', label: 'Virus scan', detail: 'ClamAV', x: 250, y: 70, w: 150, h: 56, icon: { glyph: 'shield' }, mine: true },
        { id: 'review', label: 'Review screens', detail: 'React', x: 516, y: 70, w: 160, h: 56, icon: { glyph: 'browser' }, mine: true },
        { id: 'backend', label: 'Backend', detail: 'Spring Boot', x: 516, y: 172, w: 160, h: 56, icon: { glyph: 'server' }, mine: true },
        { id: 'history', label: 'Event history', detail: 'PostgreSQL', x: 516, y: 282, w: 160, h: 56, icon: { glyph: 'database' }, mine: true },
        { id: 'partner-bus', label: 'Partner event bus', x: 738, y: 178, w: 44, h: 44, icon: { aws: 'eventbridge' } },
        { id: 'input-enricher', label: 'Input enricher', x: 844, y: 178, w: 44, h: 44, icon: { aws: 'lambda' }, mine: true },
        { id: 'event-queues', label: 'Queue per event type', x: 950, y: 178, w: 44, h: 44, icon: { aws: 'sqs' }, stack: true, dlq: true },
        { id: 'frontera', label: 'Frontera', detail: 'drafts the report', x: 1050, y: 164, w: 128, h: 72, icon: { glyph: 'spark' } },
        { id: 'output-enricher', label: 'Output enricher', x: 738, y: 418, w: 44, h: 44, icon: { aws: 'lambda' }, mine: true, labelBelow: true },
        { id: 'documents', label: 'Documents', x: 952, y: 418, w: 44, h: 44, icon: { aws: 's3' }, labelBelow: true },
    ],
    edges: [
        { id: 'crm-portal', kind: 'main', from: { node: 'crm', side: 'top' }, to: { node: 'portal', side: 'bottom', offset: -13 } },
        {
            id: 'portal-documents',
            kind: 'main',
            from: { node: 'portal', side: 'bottom', offset: 55 },
            to: { node: 'documents', side: 'left' },
            via: [
                { x: 142, y: 530 },
                { x: 920, y: 530 },
            ],
            label: 'client documents',
            labelAt: { x: 330, y: 522 },
        },
        { id: 'portal-bus', kind: 'main', from: { node: 'portal', side: 'right' }, to: { node: 'internal-bus', side: 'left' }, killSwitch: true },
        { id: 'bus-enricher', kind: 'main', from: { node: 'internal-bus', side: 'right' }, to: { node: 'enricher', side: 'left' } },
        { id: 'enricher-queue', kind: 'main', from: { node: 'enricher', side: 'right' }, to: { node: 'internal-queue', side: 'left' } },
        { id: 'queue-backend', kind: 'main', from: { node: 'internal-queue', side: 'right' }, to: { node: 'backend', side: 'left' }, killSwitch: true },
        { id: 'backend-history', kind: 'main', from: { node: 'backend', side: 'bottom' }, to: { node: 'history', side: 'top' } },
        { id: 'backend-partner', kind: 'main', from: { node: 'backend', side: 'right' }, to: { node: 'partner-bus', side: 'left' }, killSwitch: true },
        { id: 'partner-input', kind: 'main', from: { node: 'partner-bus', side: 'right' }, to: { node: 'input-enricher', side: 'left' } },
        { id: 'input-queues', kind: 'main', from: { node: 'input-enricher', side: 'right' }, to: { node: 'event-queues', side: 'left' } },
        { id: 'queues-frontera', kind: 'main', from: { node: 'event-queues', side: 'right' }, to: { node: 'frontera', side: 'left' } },
        {
            id: 'documents-frontera',
            kind: 'main',
            from: { node: 'documents', side: 'right', offset: -8 },
            to: { node: 'frontera', side: 'bottom', offset: 18 },
            label: 'documents',
            labelAt: { x: 1064, y: 424 },
        },
        {
            id: 'report',
            kind: 'return',
            from: { node: 'frontera', side: 'bottom', offset: 40 },
            to: { node: 'documents', side: 'right', offset: 8 },
            label: 'report PDF',
            labelAt: { x: 1072, y: 467 },
        },
        {
            id: 'result',
            kind: 'return',
            from: { node: 'frontera', side: 'bottom', offset: -26 },
            to: { node: 'partner-bus', side: 'bottom', offset: 12 },
            via: [
                { x: 1088, y: 330 },
                { x: 772, y: 330 },
            ],
            label: 'result',
            labelAt: { x: 1010, y: 322 },
        },
        {
            id: 'partner-output',
            kind: 'return',
            from: { node: 'partner-bus', side: 'bottom', offset: -12 },
            to: { node: 'output-enricher', side: 'top', offset: -12 },
        },
        {
            id: 'output-queue',
            kind: 'return',
            from: { node: 'output-enricher', side: 'left' },
            to: { node: 'internal-queue', side: 'bottom' },
            label: 'into the internal queue',
            labelAt: { x: 596, y: 432 },
        },
        { id: 'backend-review', kind: 'return', from: { node: 'backend', side: 'top' }, to: { node: 'review', side: 'bottom' } },
        {
            id: 'review-scan',
            kind: 'return',
            from: { node: 'review', side: 'left' },
            to: { node: 'virus-scan', side: 'right' },
            label: 'forward report',
            labelAt: { x: 458, y: 88 },
        },
        { id: 'scan-portal', kind: 'return', from: { node: 'virus-scan', side: 'left' }, to: { node: 'portal', side: 'top' } },
    ],
    steps: [
        { text: 'The CRM places a client and hands the work to the Provider portal.', edges: ['crm-portal'], badge: { x: 106, y: 266 } },
        {
            text: "The Provider portal uploads the client's documents to S3 and publishes client and document events to the internal event bus.",
            edges: ['portal-documents', 'portal-bus'],
            badge: { x: 178, y: 176 },
            mine: true,
        },
        {
            text: 'An enricher Lambda adds context and queues each event in SQS.',
            edges: ['bus-enricher', 'enricher-queue'],
            badge: { x: 330, y: 248 },
            mine: true,
        },
        {
            text: 'The MyBrightLink backend pulls the queue and records each event once, so a redelivered event is not processed twice.',
            edges: ['queue-backend', 'backend-history'],
            badge: { x: 486, y: 176 },
            mine: true,
        },
        {
            text: 'It publishes to the partner event bus, and an enricher Lambda fans the events out to one queue per event type.',
            edges: ['backend-partner', 'partner-input', 'input-queues'],
            badge: { x: 866, y: 248 },
            mine: true,
        },
        {
            text: 'Frontera picks up the events, reads the documents from S3, drafts the assessment report and stores the PDF in the same bucket.',
            edges: ['queues-frontera', 'documents-frontera', 'report'],
            badge: { x: 1027, y: 176 },
        },
        {
            text: 'The result comes back through the partner bus, and an output Lambda queues it for MyBrightLink.',
            edges: ['result', 'partner-output', 'output-queue'],
            badge: { x: 930, y: 330 },
            mine: true,
        },
        {
            text: 'A clinician reviews the report in MyBrightLink; it is scanned for viruses with ClamAV and forwarded to the Provider portal.',
            edges: ['backend-review', 'review-scan', 'scan-portal'],
            badge: { x: 205, y: 78 },
            mine: true,
        },
    ],
};
