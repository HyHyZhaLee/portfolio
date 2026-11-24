import { useId } from 'react';
import { Section } from '../components/Section';
import { useModalDialog } from '../components/useModalDialog';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { awards, degrees, type Certificate, type EducationItem } from '../content/education';
import { t, type MessageKey } from '../i18n/en';

const groups: readonly { heading: MessageKey; items: readonly EducationItem[] }[] = [
    { heading: 'education.degrees', items: degrees },
    { heading: 'education.awards', items: awards },
];

/**
 * A "View certificate" button and the modal dialog it opens. The native dialog traps focus, closes on Escape, and
 * returns focus to the button; a click on the backdrop closes it too. The image loads only once the dialog opens.
 */
function CertificateViewer({ title, certificate }: { title: string; certificate: Certificate }) {
    const { isOpen, open, close, dialogRef, dialogProps } = useModalDialog();
    const headingId = useId();

    return (
        <>
            <button
                type='button'
                onClick={open}
                className='touch-target mt-1.5 font-ui text-sm font-semibold text-accent underline-offset-4 hover:underline'
                {...getTestIdProp(TestIds.education.certificateButton)}
            >
                {t('education.viewCertificate')}
                <span className='sr-only'>: {title}</span>
            </button>
            <dialog
                aria-labelledby={headingId}
                ref={dialogRef}
                {...dialogProps}
                className='m-auto w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-panel border border-line bg-surface-raised text-ink shadow-panel backdrop:bg-ink/70'
                {...getTestIdProp(TestIds.education.certificateDialog)}
            >
                <div className='flex items-center justify-between gap-4 border-b border-line px-5 py-3'>
                    <h2 id={headingId} className='font-ui text-base font-semibold'>
                        {title}
                    </h2>
                    <button
                        type='button'
                        onClick={close}
                        className='rounded-control border border-line px-3 py-1.5 font-ui text-label font-medium hover:border-ink'
                        {...getTestIdProp(TestIds.education.certificateClose)}
                    >
                        {t('education.closeCertificate')}
                    </button>
                </div>
                {isOpen && (
                    <img
                        src={certificate.src}
                        alt={certificate.alt}
                        width={certificate.width}
                        height={certificate.height}
                        className='block max-h-[calc(100svh-8rem)] w-full bg-surface-sunk object-contain'
                    />
                )}
            </dialog>
        </>
    );
}

export function Education() {
    return (
        <Section id='education' heading={t('education.heading')}>
            {groups.map((group) => (
                <div key={group.heading} className='not-first:mt-8'>
                    <h3 className='mb-2 text-body font-bold'>{t(group.heading)}</h3>
                    <ul>
                        {group.items.map((item) => (
                            <li
                                key={item.title}
                                className='reveal grid gap-1 border-t border-line py-4 last:border-b md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8'
                            >
                                <h4 className='text-base leading-snug font-normal'>{item.title}</h4>
                                <div>
                                    <p>{item.detail}</p>
                                    {item.certificate && <CertificateViewer title={item.title} certificate={item.certificate} />}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </Section>
    );
}
