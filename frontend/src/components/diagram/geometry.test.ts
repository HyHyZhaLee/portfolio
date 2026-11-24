import { describe, expect, it } from 'vitest';
import { anchorPoint, longestSegmentCentre, pathMidpoint, roundedPath, routePoints, wrapLines } from './geometry';

const box = { x: 10, y: 20, w: 100, h: 40 };

describe('diagram geometry', () => {
    it.each([
        ['top', undefined, { x: 60, y: 20 }],
        ['right', undefined, { x: 110, y: 40 }],
        ['bottom', undefined, { x: 60, y: 60 }],
        ['left', undefined, { x: 10, y: 40 }],
        ['bottom', 12, { x: 72, y: 60 }],
        ['left', 12, { x: 10, y: 52 }],
    ] as const)('anchors the %s side with offset %s', (side, offset, expected) => {
        expect(anchorPoint(box, side, offset)).toEqual(expected);
    });

    it.each([
        [
            'aligned',
            { x: 0, y: 0 },
            'right',
            { x: 100, y: 0 },
            'left',
            [],
            [
                { x: 0, y: 0 },
                { x: 95, y: 0 },
            ],
        ],
        [
            'elbow',
            { x: 0, y: 0 },
            'right',
            { x: 100, y: 100 },
            'top',
            [],
            [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 95 },
            ],
        ],
        [
            'same direction',
            { x: 0, y: 0 },
            'right',
            { x: 100, y: 50 },
            'left',
            [],
            [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 50, y: 50 },
                { x: 95, y: 50 },
            ],
        ],
        [
            'via',
            { x: 0, y: 0 },
            'bottom',
            { x: 80, y: 0 },
            'bottom',
            [
                { x: 0, y: 50 },
                { x: 80, y: 50 },
            ],
            [
                { x: 0, y: 0 },
                { x: 0, y: 50 },
                { x: 80, y: 50 },
                { x: 80, y: 5 },
            ],
        ],
    ] as const)('routes a %s edge', (_name, start, startSide, end, endSide, via, expected) => {
        expect(routePoints(start, startSide, end, endSide, via, 5)).toEqual(expected);
    });

    it.each([
        [
            'a straight line',
            [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
            ],
            10,
            'M0 0L100 0',
        ],
        [
            'a corner',
            [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
            ],
            10,
            'M0 0L90 0Q100 0 100 10L100 100',
        ],
        [
            'a short segment, clamping the radius',
            [
                { x: 0, y: 0 },
                { x: 8, y: 0 },
                { x: 8, y: 100 },
            ],
            10,
            'M0 0L4 0Q8 0 8 4L8 100',
        ],
        [
            'collinear points',
            [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 100, y: 0 },
            ],
            10,
            'M0 0L50 0L100 0',
        ],
    ])('rounds %s', (_name, points, radius, expected) => {
        expect(roundedPath(points, radius)).toBe(expected);
    });

    it('finds the midpoint and the longest segment centre', () => {
        expect(
            pathMidpoint([
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
            ]),
        ).toEqual({ x: 100, y: 0 });
        expect(
            longestSegmentCentre([
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 30 },
            ]),
        ).toEqual({ x: 50, y: 0 });
    });

    it.each([
        ['Internal event bus', 13, ['Internal', 'event bus']],
        ['Enricher', 13, ['Enricher']],
        ['Queue per event type', 13, ['Queue per', 'event type']],
        ['a verylongword', 5, ['a', 'verylongword']],
    ])('wraps "%s" at %s characters', (text, max, expected) => {
        expect(wrapLines(text, max)).toEqual(expected);
    });
});
