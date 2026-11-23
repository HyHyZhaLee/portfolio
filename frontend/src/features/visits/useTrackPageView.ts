import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { RecordVisitBody } from './api';
import { useRecordVisit } from './queries';
import { readTrackingParams, referrerOrigin, rememberRef, setOptOut, storedRef, trackingAllowed } from './tracking';

/**
 * The page-view beacon (F2): one view per route opened, the first load included (FR-1, D1). It applies `?notrack=1` or
 * `?notrack=0` and keeps `?ref=`, then removes only those two parameters with the router's replace navigation, keeping
 * the path, the other parameters, and the hash, without moving the page (FR-3, FR-4, D5). It sends a view only from a
 * production build without an opt-out or Global Privacy Control, with the referrer as its origin (FR-2, P13). The
 * effect is keyed on the pathname only, so anchors, query changes, and the cleanup itself never send another view
 * (KNOWN-FE-002).
 */
export function useTrackPageView(): void {
    const { pathname, search, hash } = useLocation();
    const navigate = useNavigate();
    const { mutate } = useRecordVisit();

    const onRouteOpened = useEffectEvent((path: string) => {
        const params = readTrackingParams(search);
        if (params.notrack !== null || params.ref !== null) {
            if (params.notrack === '1') {
                setOptOut(true);
            } else if (params.notrack === '0') {
                setOptOut(false);
            }
            if (params.ref) {
                rememberRef(params.ref);
            }
            void navigate({ pathname: path, search: params.remaining, hash }, { replace: true, preventScrollReset: true });
        }
        if (!trackingAllowed()) {
            return;
        }
        const body: RecordVisitBody = { path };
        const referrer = referrerOrigin(document.referrer);
        if (referrer) {
            body.referrer = referrer;
        }
        const ref = storedRef() ?? params.ref;
        if (ref) {
            body.ref = ref;
        }
        mutate(body);
    });

    useEffect(() => {
        onRouteOpened(pathname);
    }, [pathname]);
}
