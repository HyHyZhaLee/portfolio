import { useMutation } from '@tanstack/react-query';
import { sendContactMessage } from './api';

export const contactKeys = {
    all: ['contact'] as const,
    send: () => [...contactKeys.all, 'send'] as const,
};

/** Sends one contact message. Never retried: a creating request must not be sent twice by the library. */
export function useSendContactMessage() {
    return useMutation({
        mutationKey: contactKeys.send(),
        mutationFn: sendContactMessage,
        retry: false,
    });
}
