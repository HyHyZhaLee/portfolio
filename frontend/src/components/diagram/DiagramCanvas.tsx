import { useId, type ReactElement } from 'react';
import eventbridge from '../../assets/aws/eventbridge.svg?no-inline';
import lambda from '../../assets/aws/lambda.svg?no-inline';
import s3 from '../../assets/aws/s3.svg?no-inline';
import sqs from '../../assets/aws/sqs.svg?no-inline';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import type { ArchitectureDiagram, AwsIcon, DiagramEdge, DiagramNode, DiagramZone, EdgeKind, Point } from '../../content/diagrams/types';
import { t } from '../../i18n/en';
import { anchorPoint, longestSegmentCentre, pathMidpoint, roundedPath, routePoints, wrapLines, type Box } from './geometry';
import { glyphShapes } from './glyphs';

export interface DiagramCanvasProps {
    diagram: ArchitectureDiagram;
    /** The highlighted step's index (0-based), or `undefined` when no step is active. */
    activeStep: number | undefined;
}

/** Official AWS Architecture Icons, unmodified (P9), served as image files rather than inlined, so they stay out of the entry bundle. */
const awsIcons: Readonly<Record<AwsIcon, string>> = { eventbridge, lambda, sqs, s3 };

/** Stroke, dash, and fill classes per flow kind: colour plus line style, so colour is never the only cue (P6). */
const flow: Readonly<Record<EdgeKind, { stroke: string; fill: string; dash?: string; width: number }>> = {
    main: { stroke: 'stroke-ink', fill: 'fill-ink', width: 1.8 },
    return: { stroke: 'stroke-flow-return', fill: 'fill-flow-return', dash: '6 5', width: 1.8 },
    failure: { stroke: 'stroke-flow-failure', fill: 'fill-flow-failure', dash: '1.5 4.5', width: 1.9 },
};

const STAR = 'M8 1.6l1.9 3.95 4.33.6-3.15 3.03.77 4.3L8 11.43 4.15 13.48l.77-4.3L1.77 6.15l4.33-.6z';
/** Average glyph width of the UI font as a share of the font size, for wrapping labels to a box. */
const CHAR_WIDTH = 0.53;
/** How far the accent frame of an AWS node Will implemented stands out from its icon. */
const AWS_FRAME = 7;
/** How far a stack's back card sits to the right of (and above) its front icon. */
const STACK_SHIFT = 10;
const dims = 'motion-safe:transition-opacity data-dim:opacity-15';

const isAws = (node: DiagramNode) => 'aws' in node.icon;

/** The node's outer box: the card, the icon square (widened by a stack's back cards), or the accent frame around a ★ icon. Edges attach to it. */
function frameOf(node: DiagramNode): Box {
    if (!isAws(node)) return node;
    if (node.mine) return { x: node.x - AWS_FRAME, y: node.y - AWS_FRAME, w: node.w + 2 * AWS_FRAME, h: node.h + 2 * AWS_FRAME };
    return node.stack ? { ...node, w: node.w + STACK_SHIFT } : node;
}

function stateProps(isActive: boolean, anyActive: boolean) {
    if (!anyActive) return {};
    return isActive ? { 'data-active': 'true' } : { 'data-dim': 'true' };
}

/** Draws one diagram as inline SVG; with an active step, its edges, nodes, and badge get `data-active` and the rest `data-dim` (P5). */
export function DiagramCanvas({ diagram, activeStep }: DiagramCanvasProps) {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]));
    const step = activeStep === undefined ? undefined : diagram.steps[activeStep];
    const activeEdges = new Set(step?.edges);
    const activeNodes = new Set(step?.nodes);
    for (const edge of diagram.edges) {
        if (activeEdges.has(edge.id)) activeNodes.add(edge.from.node).add(edge.to.node);
    }
    const anyActive = step !== undefined;

    return (
        <svg
            role='img'
            aria-labelledby={`${uid}-title`}
            aria-describedby={`${uid}-desc`}
            viewBox={`0 0 ${diagram.width} ${diagram.height}`}
            className='block h-auto w-full min-w-208 font-ui'
        >
            <title id={`${uid}-title`}>{diagram.title}</title>
            <desc id={`${uid}-desc`}>{diagram.description}</desc>
            <defs>
                {(Object.keys(flow) as EdgeKind[]).map((kind) => (
                    <marker
                        key={kind}
                        id={`${uid}-arrow-${kind}`}
                        viewBox='0 0 10 10'
                        refX='9'
                        refY='5'
                        markerWidth='7'
                        markerHeight='7'
                        orient='auto-start-reverse'
                    >
                        <path d='M0 0L10 5L0 10z' className={flow[kind].fill} />
                    </marker>
                ))}
            </defs>
            {diagram.zones.map((zone) => (
                <Zone key={zone.id} zone={zone} />
            ))}
            {diagram.edges.map((edge) => {
                const from = nodesById.get(edge.from.node);
                const to = nodesById.get(edge.to.node);
                if (!from || !to) return null;
                return (
                    <Edge
                        key={edge.id}
                        edge={edge}
                        from={frameOf(from)}
                        to={frameOf(to)}
                        markerId={`${uid}-arrow-${edge.kind}`}
                        isActive={activeEdges.has(edge.id)}
                        anyActive={anyActive}
                    />
                );
            })}
            {diagram.nodes.map((node) => (
                <Node key={node.id} node={node} isActive={activeNodes.has(node.id)} anyActive={anyActive} />
            ))}
            {diagram.steps.map((item, index) => (
                <g key={index} aria-hidden='true' className={dims} {...stateProps(index === activeStep, anyActive)}>
                    <circle
                        cx={item.badge.x}
                        cy={item.badge.y}
                        r='11'
                        strokeWidth='2.5'
                        className={`stroke-surface-raised ${index === activeStep ? 'fill-accent' : 'fill-ink'}`}
                    />
                    <text x={item.badge.x} y={item.badge.y + 4.5} textAnchor='middle' fontSize='12' fontWeight='700' className='fill-accent-ink'>
                        {index + 1}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function Zone({ zone }: { zone: DiagramZone }) {
    return (
        <g>
            <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                rx='14'
                strokeWidth={zone.aws ? 1.25 : 0}
                className={zone.aws ? 'fill-surface stroke-ink/30' : 'fill-surface-sunk'}
            />
            {zone.aws && (
                <>
                    <rect x={zone.x + 14} y={zone.y + 13} width='34' height='17' rx='4' className='fill-ink' />
                    <text x={zone.x + 31} y={zone.y + 25.5} textAnchor='middle' fontSize='10.5' fontWeight='700' className='fill-accent-ink'>
                        {t('diagram.awsTag')}
                    </text>
                </>
            )}
            <text x={zone.x + (zone.aws ? 56 : 14)} y={zone.y + 26} fontSize='12.5' fontWeight='650' className='fill-muted'>
                {zone.label}
            </text>
        </g>
    );
}

interface EdgeProps {
    edge: DiagramEdge;
    from: Box;
    to: Box;
    markerId: string;
    isActive: boolean;
    anyActive: boolean;
}

function Edge({ edge, from, to, markerId, isActive, anyActive }: EdgeProps) {
    const style = flow[edge.kind];
    const points = routePoints(
        anchorPoint(from, edge.from.side, edge.from.offset),
        edge.from.side,
        anchorPoint(to, edge.to.side, edge.to.offset),
        edge.to.side,
        edge.via,
    );
    const centre = longestSegmentCentre(points);
    const labelAt: Point = edge.labelAt ?? { x: centre.x, y: centre.y - 8 };
    const toggle = edge.killSwitch ? pathMidpoint(points) : undefined;

    return (
        <g className={`fill-none ${dims}`} data-edge-id={edge.id} {...getTestIdProp(TestIds.caseStudy.diagramEdge)} {...stateProps(isActive, anyActive)}>
            <path
                d={roundedPath(points)}
                strokeWidth={isActive ? style.width + 0.8 : style.width}
                strokeDasharray={style.dash}
                strokeLinecap='round'
                strokeLinejoin='round'
                markerEnd={`url(#${markerId})`}
                className={style.stroke}
            />
            {toggle && (
                <g transform={`translate(${toggle.x} ${toggle.y})`}>
                    <rect x='-11' y='-6.5' width='22' height='13' rx='6.5' strokeWidth='1.5' className='fill-surface-raised stroke-ink' />
                    <circle cx='4.5' r='3.6' className='fill-ink' />
                </g>
            )}
            {edge.label && (
                <text x={labelAt.x} y={labelAt.y} textAnchor='middle' fontSize='11' fontWeight='600' className={style.fill}>
                    {edge.label}
                </text>
            )}
        </g>
    );
}

function Node({ node, isActive, anyActive }: { node: DiagramNode; isActive: boolean; anyActive: boolean }) {
    const frame = frameOf(node);
    return (
        <g className={dims} data-node-id={node.id} {...getTestIdProp(TestIds.caseStudy.diagramNode)} {...stateProps(isActive, anyActive)}>
            {'aws' in node.icon ? <AwsNode node={node} icon={node.icon.aws} frame={frame} /> : <CardNode node={node} glyph={glyphShapes[node.icon.glyph]} />}
            {node.dlq && (
                <g>
                    <rect x={frame.x + frame.w - 16} y={frame.y + frame.h - 8} width='28' height='14' rx='7' className='fill-surface-raised stroke-muted' />
                    <text x={frame.x + frame.w - 2} y={frame.y + frame.h + 2.5} textAnchor='middle' fontSize='9' fontWeight='700' className='fill-muted'>
                        {t('diagram.dlqTag')}
                    </text>
                </g>
            )}
            {node.mine && (
                <g transform={`translate(${frame.x + frame.w - 2} ${frame.y + 2})`}>
                    <circle r='8.5' strokeWidth='2' className='fill-accent stroke-surface-raised' />
                    <path d={STAR} transform='translate(-6 -6) scale(0.75)' className='fill-accent-ink' />
                </g>
            )}
        </g>
    );
}

/** A card: glyph, label, and detail lines, vertically centred. Narrow cards use a tighter inset. */
function CardNode({ node, glyph }: { node: DiagramNode; glyph: ReactElement }) {
    const compact = node.w < 150;
    const textX = node.x + (compact ? 35 : 44);
    const details = node.detail ? wrapLines(node.detail, Math.floor((node.x + node.w - 6 - textX) / (11.5 * CHAR_WIDTH))) : [];
    const firstBaseline = node.y + node.h / 2 - (16 + 15 * details.length) / 2 + 12;
    return (
        <>
            <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx='10'
                strokeWidth={node.mine ? 1.8 : 1.25}
                className={node.mine ? 'fill-accent/8 stroke-accent' : 'fill-surface-raised stroke-line'}
            />
            <g transform={`translate(${node.x + (compact ? 7 : 12)} ${node.y + node.h / 2 - 12})`} strokeWidth='1.7' className='fill-none stroke-ink'>
                {glyph}
            </g>
            <text x={textX} y={firstBaseline} fontSize={compact ? 13 : 13.5} fontWeight='650' className='fill-ink'>
                {node.label}
            </text>
            {details.map((line, index) => (
                <text key={line} x={textX} y={firstBaseline + 16 + 15 * index} fontSize='11.5' fontWeight='500' className='fill-muted'>
                    {line}
                </text>
            ))}
        </>
    );
}

/** An AWS service: the official icon (stacked for a set of like resources), its label above, or below on a return lane. */
function AwsNode({ node, icon, frame }: { node: DiagramNode; icon: AwsIcon; frame: Box }) {
    const lines = [...wrapLines(node.label, 13), ...(node.detail ? [node.detail] : [])];
    // Centred on the icon itself; above it, a stack's back cards push the label up. Labels on one lane share a baseline.
    const centreX = node.x + node.w / 2;
    const firstBaseline = node.labelBelow ? node.y + node.h + 26 : node.y - 14 - (node.stack ? STACK_SHIFT : 0) - 16 * (lines.length - 1);
    return (
        <>
            {node.mine && <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx='11' strokeWidth='1.8' className='fill-accent/8 stroke-accent' />}
            {node.stack && (
                <>
                    <image href={awsIcons[icon]} x={node.x + STACK_SHIFT} y={node.y - STACK_SHIFT} width={node.w} height={node.h} opacity='0.35' />
                    <image href={awsIcons[icon]} x={node.x + STACK_SHIFT / 2} y={node.y - STACK_SHIFT / 2} width={node.w} height={node.h} opacity='0.65' />
                </>
            )}
            <image href={awsIcons[icon]} x={node.x} y={node.y} width={node.w} height={node.h} />
            {lines.map((line, index) => (
                <text
                    key={line}
                    x={centreX}
                    y={firstBaseline + 16 * index}
                    textAnchor='middle'
                    fontSize={node.detail && index === lines.length - 1 ? 11.5 : 13.5}
                    fontWeight={node.detail && index === lines.length - 1 ? 500 : 650}
                    className={node.detail && index === lines.length - 1 ? 'fill-muted' : 'fill-ink'}
                >
                    {line}
                </text>
            ))}
        </>
    );
}
