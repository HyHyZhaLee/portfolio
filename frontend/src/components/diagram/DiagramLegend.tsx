import type { ReactElement } from 'react';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import type { ArchitectureDiagram, EdgeKind } from '../../content/diagrams/types';
import { t, type MessageKey } from '../../i18n/en';

interface Mark {
    key: string;
    label: MessageKey;
    swatch: ReactElement;
}

const STAR = 'M17 2.2l.85 1.75 1.92.27-1.4 1.35.34 1.9L17 6.56l-1.71.91.34-1.9-1.4-1.35 1.92-.27z';

function line(kind: EdgeKind): ReactElement {
    const style = {
        main: { stroke: 'stroke-ink', fill: 'fill-ink', dash: undefined },
        return: { stroke: 'stroke-flow-return', fill: 'fill-flow-return', dash: '6 5' },
        failure: { stroke: 'stroke-flow-failure', fill: 'fill-flow-failure', dash: '1.5 4.5' },
    }[kind];
    return (
        <svg width='34' height='10' viewBox='0 0 34 10' className='shrink-0'>
            <path d='M2 5H27' strokeWidth='1.8' strokeDasharray={style.dash} strokeLinecap='round' className={style.stroke} />
            <path d='M26 1L33 5L26 9z' className={style.fill} />
        </svg>
    );
}

/** The marks this diagram uses, and only those: My part, the three flow kinds, the kill switch, and the DLQ tag. */
export function DiagramLegend({ diagram }: { diagram: ArchitectureDiagram }) {
    const kinds = new Set(diagram.edges.map((edge) => edge.kind));
    const marks: Mark[] = [];
    if (diagram.nodes.some((node) => node.mine) || diagram.steps.some((step) => step.mine)) {
        marks.push({
            key: 'mine',
            label: 'diagram.mine',
            swatch: (
                <svg width='22' height='22' viewBox='0 0 22 22' className='shrink-0'>
                    <rect x='1' y='3' width='20' height='16' rx='5' strokeWidth='1.6' className='fill-accent/8 stroke-accent' />
                    <circle cx='17' cy='5' r='5' className='fill-accent' />
                    <path d={STAR} className='fill-accent-ink' />
                </svg>
            ),
        });
    }
    if (kinds.has('main')) marks.push({ key: 'main', label: 'diagram.main', swatch: line('main') });
    if (kinds.has('return')) marks.push({ key: 'return', label: 'diagram.return', swatch: line('return') });
    if (kinds.has('failure')) marks.push({ key: 'failure', label: 'diagram.failure', swatch: line('failure') });
    if (diagram.edges.some((edge) => edge.killSwitch)) {
        marks.push({
            key: 'kill-switch',
            label: 'diagram.killSwitch',
            swatch: (
                <svg width='24' height='14' viewBox='0 0 24 14' className='shrink-0'>
                    <rect x='1' y='0.75' width='22' height='12.5' rx='6.25' strokeWidth='1.5' className='fill-surface-raised stroke-ink' />
                    <circle cx='16.5' cy='7' r='3.6' className='fill-ink' />
                </svg>
            ),
        });
    }
    if (diagram.nodes.some((node) => node.dlq)) {
        marks.push({
            key: 'dlq',
            label: 'diagram.dlq',
            swatch: (
                <svg width='30' height='16' viewBox='0 0 30 16' className='shrink-0'>
                    <rect x='1' y='1' width='28' height='14' rx='7' className='fill-surface-raised stroke-muted' />
                    <text x='15' y='11.5' textAnchor='middle' fontSize='9' fontWeight='700' className='fill-muted'>
                        {t('diagram.dlqTag')}
                    </text>
                </svg>
            ),
        });
    }

    return (
        <ul
            className='mt-3.5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 font-ui text-caption text-muted'
            {...getTestIdProp(TestIds.caseStudy.diagramLegend)}
        >
            {marks.map((mark) => (
                <li key={mark.key} className='inline-flex items-center gap-2'>
                    <span aria-hidden='true' className='inline-flex'>
                        {mark.swatch}
                    </span>
                    {t(mark.label)}
                </li>
            ))}
        </ul>
    );
}
