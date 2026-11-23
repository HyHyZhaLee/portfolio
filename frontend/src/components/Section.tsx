import type { ReactNode } from 'react';

interface SectionProps {
    /** The anchor that the header navigation links to, such as `work`. */
    id: string;
    heading: string;
    intro?: string;
    children: ReactNode;
}

/** A home page section: on desktop its heading sits in a sticky left rail beside the content. */
export function Section({ id, heading, intro, children }: SectionProps) {
    const headingId = `${id}-heading`;
    return (
        <section id={id} aria-labelledby={headingId} className='border-t border-line py-16 lg:py-22'>
            <div className='wrap grid gap-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14'>
                <div className='lg:sticky lg:top-24 lg:self-start'>
                    <h2 id={headingId} className='text-section font-bold'>
                        {heading}
                    </h2>
                    {intro && <p className='mt-2.5 max-w-[28ch] font-ui text-label text-muted'>{intro}</p>}
                </div>
                <div className='min-w-0'>{children}</div>
            </div>
        </section>
    );
}
