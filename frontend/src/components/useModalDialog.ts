import { useCallback, useRef, useState, type MouseEvent, type RefObject } from 'react';

interface ModalDialog {
    /** True while the dialog is open; kept in step with the native `close` event, so Escape updates it too. */
    isOpen: boolean;
    /** Opens the dialog as a modal. */
    open: () => void;
    /** Closes the dialog. */
    close: () => void;
    /** Pass as the `<dialog>` ref. */
    dialogRef: RefObject<HTMLDialogElement | null>;
    /** Spread onto the `<dialog>`: the `close` sync and the backdrop-click close. */
    dialogProps: {
        onClose: () => void;
        onClick: (event: MouseEvent<HTMLDialogElement>) => void;
    };
}

/**
 * Owns a native modal dialog: its ref, open state, show, close, and backdrop-click close. The native dialog traps focus,
 * closes on Escape, and returns focus to the element that opened it.
 */
export function useModalDialog(): ModalDialog {
    const ref = useRef<HTMLDialogElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const open = () => {
        setIsOpen(true);
        ref.current?.showModal();
    };
    const close = useCallback(() => {
        ref.current?.close();
    }, []);

    return {
        isOpen,
        open,
        close,
        dialogRef: ref,
        dialogProps: {
            onClose: () => {
                setIsOpen(false);
            },
            onClick: (event) => {
                // The content fills the dialog, so a click that lands on the dialog itself is on the backdrop.
                if (event.target === event.currentTarget) {
                    event.currentTarget.close();
                }
            },
        },
    };
}
