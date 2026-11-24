import { useEffect, useState } from 'react';

/**
 * The id of the first listed section crossing a thin band through the middle of the viewport, or null when none does,
 * when disabled, or where IntersectionObserver is missing (PF-015 P3, F1). Ids are in page order.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): string | null {
    const [active, setActive] = useState<string | null>(null);
    // A string dependency keeps the effect from re-running when the caller passes a new array with the same ids.
    const idKey = ids.join(',');

    useEffect(() => {
        if (!enabled || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }
        const order = idKey.split(',');
        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        visible.add(entry.target.id);
                    } else {
                        visible.delete(entry.target.id);
                    }
                }
                const winner = order.find((id) => visible.has(id)) ?? null;
                setActive((current) => (current === winner ? current : winner));
            },
            { rootMargin: '-45% 0px -50% 0px' },
        );
        for (const id of order) {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        }
        return () => {
            observer.disconnect();
        };
    }, [idKey, enabled]);

    return enabled ? active : null;
}
