import { useEffect, useEffectEvent, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { RecordVisitBody } from './api';
import { useRecordVisit } from './queries';
import { readTrackingParams, referrerOrigin, rememberRef, setOptOut, storedRef, trackedPath, trackingAllowed } from './tracking';

/**
 * The page-view beacon (F2): one view per route opened, the first load included (FR-1, D1). It applies `?notrack=1` or
 * `?notrack=0` and keeps `?ref=`, then removes only those two parameters with the router's replace navigation, keeping
 * the path, the other parameters, and the hash, without moving the page (FR-3, FR-4, D5). It sends a view only from a
 * production build without an opt-out or Global Privacy Control, with the referrer as its origin (FR-2, P13), and only
 * for the home page and case-study routes, the paths the API accepts (PF-029 P7). The
 * effect is keyed on the pathname only, so anchors, query changes, and the cleanup itself never send another view
 * (KNOWN-FE-002).
 *
 * A view goes out only once `apiOnline` is true, that is once the page's health check has answered: routes opened
 * before then wait in a queue and are sent in order as soon as it does, so a view reaches an awake backend instead of
 * racing its cold start. A view is still never retried, because a retry could count it twice (PF-023 D4).
 */
export function useTrackPageView(apiOnline: boolean): void {
    const { pathname, search, hash } = useLocation();
    const navigate = useNavigate();
    const { mutate } = useRecordVisit();
    const queued = useRef<RecordVisitBody[]>([]);

    const sendQueued = useEffectEvent(() => {
        if (!apiOnline) {
            return;
        }
        for (const body of queued.current.splice(0)) {
            mutate(body);
        }
    });

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
        const tracked = trackedPath(path);
        if (!tracked || !trackingAllowed()) {
            return;
        }
        const body: RecordVisitBody = { path: tracked };
        const referrer = referrerOrigin(document.referrer);
        if (referrer) {
            body.referrer = referrer;
        }
        const ref = storedRef() ?? params.ref;
        if (ref) {
            body.ref = ref;
        }
        queued.current.push(body);
        sendQueued();
    });

    useEffect(() => {
        onRouteOpened(pathname);
    }, [pathname]);

    useEffect(() => {
        if (apiOnline) {
            sendQueued();
        }
    }, [apiOnline]);
}
