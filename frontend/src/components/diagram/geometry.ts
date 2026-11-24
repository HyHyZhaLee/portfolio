import type { Point, Side } from '../../content/diagrams/types';

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** How far an edge stops short of the node it enters, so the arrowhead does not touch the node. */
export const END_GAP = 5;

const isHorizontal = (side: Side) => side === 'left' || side === 'right';

/** The point on `side` of `box`, `offset` units from that side's centre: rightward on top and bottom, downward on left and right. */
export function anchorPoint(box: Box, side: Side, offset = 0): Point {
    switch (side) {
        case 'top':
            return { x: box.x + box.w / 2 + offset, y: box.y };
        case 'bottom':
            return { x: box.x + box.w / 2 + offset, y: box.y + box.h };
        case 'left':
            return { x: box.x, y: box.y + box.h / 2 + offset };
        case 'right':
            return { x: box.x + box.w, y: box.y + box.h / 2 + offset };
    }
}

/**
 * An orthogonal polyline from `start` through `via` to `end`. Between two points that share neither x nor y it adds
 * elbows: the first leg leaves in the direction of `startSide` (horizontal for left or right), each later leg turns from
 * the previous one, and the last leg enters in the direction of `endSide`; when both directions are the same, the leg
 * turns twice at the midpoint. The end is pulled back `gap` units toward the previous point.
 */
export function routePoints(start: Point, startSide: Side, end: Point, endSide: Side, via: readonly Point[] = [], gap = END_GAP): Point[] {
    const stops = [start, ...via, end];
    const out: Point[] = [start];
    let leaveHorizontally = isHorizontal(startSide);
    for (let i = 1; i < stops.length; i++) {
        const a = out[out.length - 1] ?? start;
        const b = stops[i] ?? end;
        const last = i === stops.length - 1;
        if (a.x !== b.x && a.y !== b.y) {
            const enterHorizontally = last ? isHorizontal(endSide) : !leaveHorizontally;
            if (leaveHorizontally && !enterHorizontally) out.push({ x: b.x, y: a.y });
            else if (!leaveHorizontally && enterHorizontally) out.push({ x: a.x, y: b.y });
            else if (leaveHorizontally) out.push({ x: (a.x + b.x) / 2, y: a.y }, { x: (a.x + b.x) / 2, y: b.y });
            else out.push({ x: a.x, y: (a.y + b.y) / 2 }, { x: b.x, y: (a.y + b.y) / 2 });
        }
        if (a.x !== b.x || a.y !== b.y) out.push(b);
        const prev = out[out.length - 2] ?? a;
        // The next leg turns from this one: after a vertical segment it leaves horizontally.
        leaveHorizontally = prev.y !== b.y;
    }
    return pullBack(out, gap);
}

function pullBack(points: Point[], gap: number): Point[] {
    const end = points[points.length - 1];
    const prev = points[points.length - 2];
    if (!end || !prev || gap <= 0) return points;
    const length = Math.hypot(end.x - prev.x, end.y - prev.y);
    if (length <= gap) return points;
    const ratio = (length - gap) / length;
    return [...points.slice(0, -1), { x: prev.x + (end.x - prev.x) * ratio, y: prev.y + (end.y - prev.y) * ratio }];
}

const num = (value: number) => String(Number(value.toFixed(2)));
const pt = ({ x, y }: Point) => `${num(x)} ${num(y)}`;

/**
 * SVG path data through `points`: `M{x} {y}`, then `L{x} {y}` per segment, with each corner rounded by a quadratic curve
 * `Q{cx} {cy} {x} {y}` of `radius`, clamped to half of the shorter adjoining segment. Collinear points add no curve.
 * Numbers are rounded to two decimals.
 */
export function roundedPath(points: readonly Point[], radius = 10): string {
    const [first, ...rest] = points;
    if (!first) return '';
    let d = `M${pt(first)}`;
    rest.forEach((p, index) => {
        const prev = points[index] ?? first;
        const next = rest[index + 1];
        const turns = next !== undefined && (next.x - p.x) * (p.y - prev.y) - (next.y - p.y) * (p.x - prev.x) !== 0;
        if (!next || !turns) {
            d += `L${pt(p)}`;
            return;
        }
        const inLength = Math.hypot(p.x - prev.x, p.y - prev.y);
        const outLength = Math.hypot(next.x - p.x, next.y - p.y);
        const r = Math.min(radius, inLength / 2, outLength / 2);
        const before = { x: p.x - ((p.x - prev.x) / inLength) * r, y: p.y - ((p.y - prev.y) / inLength) * r };
        const after = { x: p.x + ((next.x - p.x) / outLength) * r, y: p.y + ((next.y - p.y) / outLength) * r };
        d += `L${pt(before)}Q${pt(p)} ${pt(after)}`;
    });
    return d;
}

function segments(points: readonly Point[]): { a: Point; b: Point; length: number }[] {
    return points.slice(1).map((b, index) => {
        const a = points[index] ?? b;
        return { a, b, length: Math.hypot(b.x - a.x, b.y - a.y) };
    });
}

/** The point halfway along the polyline's length, for a kill-switch marker. */
export function pathMidpoint(points: readonly Point[]): Point {
    const parts = segments(points);
    let remaining = parts.reduce((sum, part) => sum + part.length, 0) / 2;
    for (const { a, b, length } of parts) {
        if (remaining <= length && length > 0) {
            return { x: a.x + ((b.x - a.x) * remaining) / length, y: a.y + ((b.y - a.y) * remaining) / length };
        }
        remaining -= length;
    }
    return points[0] ?? { x: 0, y: 0 };
}

/** The centre of the polyline's longest segment, for an edge label. */
export function longestSegmentCentre(points: readonly Point[]): Point {
    const longest = segments(points).reduce<{ a: Point; b: Point; length: number } | undefined>(
        (best, part) => (best === undefined || part.length > best.length ? part : best),
        undefined,
    );
    if (!longest) return points[0] ?? { x: 0, y: 0 };
    return { x: (longest.a.x + longest.b.x) / 2, y: (longest.a.y + longest.b.y) / 2 };
}

/** Greedy word wrap into lines of at most `maxChars` characters; a longer single word keeps a line of its own. */
export function wrapLines(text: string, maxChars: number): string[] {
    const lines: string[] = [];
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const current = lines[lines.length - 1];
        if (current !== undefined && current.length + 1 + word.length <= maxChars) lines[lines.length - 1] = `${current} ${word}`;
        else lines.push(word);
    }
    return lines;
}
