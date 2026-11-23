import { ApiError } from '../api/errors';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { t } from '../i18n/en';

interface ErrorNoteProps {
    /** A short, friendly message chosen from the error's `code`. */
    message: string;
    /** The failure; an `ApiError` adds its code and its correlation ID. */
    error?: unknown;
}

const [referenceBefore, referenceAfter] = t('errorNote.reference').split('{id}');

/**
 * A failure note (frontend principle 8): the message and, for an API error, the problem code and the correlation ID as
 * selectable text, so one click selects the reference to copy (PF-006 D18).
 */
export function ErrorNote({ message, error }: ErrorNoteProps) {
    const apiError = error instanceof ApiError ? error : undefined;
    return (
        <div
            role='alert'
            className='rounded-control border border-status-wake bg-surface-raised px-4 py-3 font-ui'
            {...getTestIdProp(TestIds.errorNote.region)}
        >
            <p className='text-label text-ink'>{message}</p>
            {apiError && (
                <p className='mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted'>
                    <span {...getTestIdProp(TestIds.errorNote.codeText)}>{t('errorNote.code', { code: apiError.code })}</span>
                    {apiError.correlationId && (
                        <span>
                            {referenceBefore}
                            <code className='select-all text-ink' {...getTestIdProp(TestIds.errorNote.referenceText)}>
                                {apiError.correlationId}
                            </code>
                            {referenceAfter}
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}
