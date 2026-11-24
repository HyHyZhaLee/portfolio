/**
 * An architecture diagram for one case study (PF-022): zones, nodes, edges, and numbered steps, laid out by hand in a
 * 1200-unit-wide viewBox and drawn by `components/diagram`. Step numbers come from array order (P3).
 */
export type Side = 'top' | 'right' | 'bottom' | 'left';

/** Main flow is ink and solid, return is teal and dashed, failure is red and dotted (P6). */
export type EdgeKind = 'main' | 'return' | 'failure';

/** Official AWS Architecture Icons, committed unmodified under `src/assets/aws/` (P9). */
export type AwsIcon = 'eventbridge' | 'lambda' | 'sqs' | 's3';

/** Generic line glyphs in the hero panel's style (P10). */
export type Glyph = 'browser' | 'layers' | 'server' | 'database' | 'queue' | 'job' | 'device' | 'person' | 'document' | 'external' | 'spark' | 'shield';

export interface Point {
    x: number;
    y: number;
}

export interface DiagramZone {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Drawn in the AWS group style: a thin border and a small "AWS" tag. */
    aws?: true;
}

/**
 * A box node (`glyph` icon: icon, label, and detail inside a card) or an AWS service node (`aws` icon: the icon itself,
 * with its label above it, or below it with `labelBelow`). `x`, `y`, `w`, `h` are the card, or the icon square.
 */
export interface DiagramNode {
    id: string;
    label: string;
    detail?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    icon: { aws: AwsIcon } | { glyph: Glyph };
    /** A part Will implemented: accent border, light accent tint, and a ★ badge (P4). */
    mine?: true;
    /** Drawn as a stack of cards, for a set of like resources such as one queue per event type. */
    stack?: true;
    /** Adds the DLQ tag: redelivered, then kept in a dead-letter queue (P7). */
    dlq?: true;
    /** An AWS node's label goes below the icon instead of above it, on a return lane. */
    labelBelow?: true;
}

/** One end of an edge: the side of a node it leaves or enters, `offset` units from that side's centre (rightward or downward). */
export interface EdgeEnd {
    node: string;
    side: Side;
    offset?: number;
}

export interface DiagramEdge {
    id: string;
    kind: EdgeKind;
    from: EdgeEnd;
    to: EdgeEnd;
    /** Corner points between the two ends; the path stays orthogonal. */
    via?: readonly Point[];
    label?: string;
    /** Where the label's centre baseline sits; by default above the middle of the edge's longest segment. */
    labelAt?: Point;
    /** A kill switch guards this hop: a small toggle marker at its midpoint (P7). */
    killSwitch?: true;
}

export interface DiagramStep {
    text: string;
    /** The edges this step highlights; their end nodes are highlighted with them. */
    edges: readonly string[];
    /** Extra nodes to highlight beyond the edges' ends. */
    nodes?: readonly string[];
    /** Where the step's number badge sits on the drawing. */
    badge: Point;
    /** A step Will implemented, where he owned a feature rather than a whole component (P4). */
    mine?: true;
}

export interface ArchitectureDiagram {
    /** The drawing's accessible name (`<title>`). */
    title: string;
    /** One sentence under the figure heading. */
    summary: string;
    /** The drawing's text alternative (`<desc>`): the whole flow in prose. */
    description: string;
    /** Who owned what, always shown under the legend. */
    ownership: string;
    width: 1200;
    height: number;
    zones: readonly DiagramZone[];
    nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[];
    steps: readonly DiagramStep[];
}
