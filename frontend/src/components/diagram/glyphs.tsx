import type { ReactElement } from 'react';
import type { Glyph } from '../../content/diagrams/types';

/**
 * The site's line icons, drawn in a 24-unit box with a 1.7 stroke in `currentColor` by whatever wraps them: the hero
 * panel wraps one in an `<svg>`, a diagram wraps one in a translated `<g>` (PF-022 P10). One source, one icon language.
 */
export const glyphShapes: Readonly<Record<Glyph, ReactElement>> = {
    browser: (
        <>
            <rect x='3' y='4.5' width='18' height='15' rx='2.5' />
            <path d='M3 9h18' />
        </>
    ),
    layers: (
        <>
            <path d='M12 3.5l8.5 4.5L12 12.5 3.5 8 12 3.5z' />
            <path d='M3.5 12L12 16.5 20.5 12' />
            <path d='M3.5 16L12 20.5 20.5 16' />
        </>
    ),
    server: (
        <>
            <rect x='4' y='4' width='16' height='6.5' rx='1.8' />
            <rect x='4' y='13.5' width='16' height='6.5' rx='1.8' />
            <path d='M7.5 7.25h.01M7.5 16.75h.01' strokeWidth='2.4' strokeLinecap='round' />
        </>
    ),
    database: (
        <>
            <ellipse cx='12' cy='6' rx='7.5' ry='2.8' />
            <path d='M4.5 6v12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6' />
            <path d='M4.5 12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8' />
        </>
    ),
    queue: (
        <>
            <rect x='3' y='7' width='18' height='10' rx='2' />
            <path d='M9 7v10M15 7v10' />
        </>
    ),
    job: (
        <>
            <circle cx='12' cy='12' r='8.5' />
            <path d='M12 7.5V12l3 2' strokeLinecap='round' strokeLinejoin='round' />
        </>
    ),
    device: (
        <>
            <rect x='6.5' y='6.5' width='11' height='11' rx='1.8' />
            <path d='M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3' strokeLinecap='round' />
        </>
    ),
    person: (
        <>
            <circle cx='12' cy='8' r='3.6' />
            <path d='M4.5 20c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6' strokeLinecap='round' />
        </>
    ),
    document: (
        <>
            <path d='M6.5 3.5h7.5l4 4v13h-11.5z' strokeLinejoin='round' />
            <path d='M14 3.5v4h4M9.5 12.5h5M9.5 16h5' />
        </>
    ),
    external: (
        <>
            <circle cx='12' cy='12' r='8.5' />
            <path d='M3.5 12h17M12 3.5c2.6 2.4 3.9 5.3 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.3-3.9-8.5s1.3-6.1 3.9-8.5z' />
        </>
    ),
    spark: (
        <>
            <path d='M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z' strokeLinejoin='round' />
            <path d='M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z' strokeLinejoin='round' />
        </>
    ),
    shield: (
        <>
            <path d='M12 3.5l7 2.8v5.2c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.3z' strokeLinejoin='round' />
            <path d='M9 12.2l2.1 2.1 4-4.2' strokeLinecap='round' strokeLinejoin='round' />
        </>
    ),
};
