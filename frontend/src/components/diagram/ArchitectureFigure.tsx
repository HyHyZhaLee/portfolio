import { useId, useState } from 'react';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import type { ArchitectureDiagram } from '../../content/diagrams/types';
import { t } from '../../i18n/en';
import { DiagramCanvas } from './DiagramCanvas';
import { DiagramLegend } from './DiagramLegend';
import { StepList } from './StepList';

/**
 * A case study's architecture diagram as a lead figure, with its legend, ownership note, and step-through (PF-022).
 * Hover or focus previews a step and a click pins it; the active step is the pinned one, else the previewed one (P5).
 * The drawing keeps a minimum width and scrolls sideways inside its frame on small screens (P8).
 */
export function ArchitectureFigure({ diagram }: { diagram: ArchitectureDiagram }) {
    const headingId = useId();
    const [previewed, setPreviewed] = useState<number | undefined>(undefined);
    const [pinned, setPinned] = useState<number | undefined>(undefined);
    const activeStep = pinned ?? previewed;

    return (
        <figure
            aria-labelledby={headingId}
            className='rounded-panel border border-line bg-surface-raised px-4 pt-5 pb-4 shadow-panel sm:px-5.5 sm:pt-5.5'
            {...getTestIdProp(TestIds.caseStudy.diagram)}
        >
            <figcaption className='flex flex-wrap items-baseline gap-x-3.5 gap-y-1'>
                <h2 id={headingId} className='text-2xl font-bold tracking-tight'>
                    {t('diagram.heading')}
                </h2>
                <p className='font-ui text-label text-muted'>{diagram.summary}</p>
            </figcaption>
            <div
                role='region'
                aria-label={diagram.title}
                tabIndex={0}
                className='mt-4 overflow-x-auto rounded-control outline-offset-3'
                {...getTestIdProp(TestIds.caseStudy.diagramScroll)}
            >
                <DiagramCanvas diagram={diagram} activeStep={activeStep} />
            </div>
            {/* The drawing overflows its frame up to a viewport of about 940 px, so the hint stays until lg (P8). */}
            <p className='mt-2 font-ui text-caption text-muted lg:hidden'>{t('diagram.scrollHint')}</p>
            <DiagramLegend diagram={diagram} />
            <p className='mt-2.5 font-ui text-sm leading-snug text-ink'>{diagram.ownership}</p>
            <h3 className='mt-4.5 mb-2 font-ui text-label font-bold'>{t('diagram.steps')}</h3>
            <StepList
                steps={diagram.steps}
                activeStep={activeStep}
                pinned={pinned}
                onPreview={setPreviewed}
                onPin={(index) => setPinned((current) => (current === index ? undefined : index))}
            />
        </figure>
    );
}
