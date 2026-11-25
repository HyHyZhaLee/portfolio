import { useEffect, useState, type RefObject } from 'react';

/**
 * Returns `true` once the element is within one viewport height below the screen, and stays `true` (PF-026 D2). Where
 * `IntersectionObserver` is missing it is `true` at once, so the content still loads.
 */
export function useNearViewport(ref: RefObject<Element | null>): boolean {
    const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

    useEffect(() => {
        const element = ref.current;
        if (near || !element) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setNear(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px 100% 0px' },
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [near, ref]);

    return near;
}
