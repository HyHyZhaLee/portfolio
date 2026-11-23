import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `delayMs`; false again as soon as `active` turns false. */
export function useSlowAfter(active: boolean, delayMs: number): boolean {
    const [elapsed, setElapsed] = useState(false);
    useEffect(() => {
        if (!active) {
            return undefined;
        }
        const timer = setTimeout(() => {
            setElapsed(true);
        }, delayMs);
        return () => {
            clearTimeout(timer);
            setElapsed(false);
        };
    }, [active, delayMs]);
    return active && elapsed;
}
