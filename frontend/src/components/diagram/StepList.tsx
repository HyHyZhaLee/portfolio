import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import type { DiagramStep } from '../../content/diagrams/types';
import { t } from '../../i18n/en';

export interface StepListProps {
    steps: readonly DiagramStep[];
    /** The highlighted step's index (0-based): the pinned one, else the hovered or focused one. */
    activeStep: number | undefined;
    /** The pinned step's index, shown as `aria-pressed="true"`. */
    pinned: number | undefined;
    /** Pointer enter or focus previews a step; pointer leave or blur passes `undefined`. */
    onPreview: (index: number | undefined) => void;
    /** A click toggles the pin on a step. */
    onPin: (index: number) => void;
}

/** The numbered steps as toggle buttons; every fact of the diagram is readable here without the drawing (P12). */
export function StepList({ steps, activeStep, pinned, onPreview, onPin }: StepListProps) {
    return (
        <ol className='grid gap-1.5 lg:block lg:columns-2 lg:gap-x-5.5'>
            {steps.map((step, index) => (
                <li key={step.text} className='lg:mb-1 lg:break-inside-avoid'>
                    <button
                        type='button'
                        aria-pressed={pinned === index}
                        data-active={activeStep === index || undefined}
                        onPointerEnter={() => onPreview(index)}
                        onPointerLeave={() => onPreview(undefined)}
                        onFocus={() => onPreview(index)}
                        onBlur={() => onPreview(undefined)}
                        onClick={() => onPin(index)}
                        className='group flex w-full cursor-pointer items-baseline gap-2.5 rounded-control px-2.5 py-2 text-left font-ui text-sm leading-snug text-ink hover:bg-surface-sunk focus-visible:bg-surface-sunk aria-pressed:bg-accent/8 aria-pressed:ring-2 aria-pressed:ring-accent aria-pressed:ring-inset motion-safe:transition-colors'
                        {...getTestIdProp(TestIds.caseStudy.diagramStep)}
                    >
                        <span
                            aria-hidden='true'
                            className='inline-grid size-5.5 shrink-0 -translate-y-px place-items-center rounded-full bg-ink text-xs font-bold text-accent-ink group-data-active:bg-accent'
                        >
                            {index + 1}
                        </span>
                        <span>
                            {step.mine && (
                                <>
                                    <svg aria-hidden='true' viewBox='0 0 16 16' className='mr-1 inline size-3.5 -translate-y-px fill-accent'>
                                        <path d='M8 1.6l1.9 3.95 4.33.6-3.15 3.03.77 4.3L8 11.43 4.15 13.48l.77-4.3L1.77 6.15l4.33-.6z' />
                                    </svg>
                                    <span className='sr-only'>{t('diagram.mine')}: </span>
                                </>
                            )}
                            {step.text}
                        </span>
                    </button>
                </li>
            ))}
        </ol>
    );
}
