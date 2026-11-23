/**
 * Helpers for the page-view beacon (F2). Storage access is wrapped: when storage is blocked, the opt-out still holds for
 * the rest of the page load and the ref tag is sent with the first view only.
 */

const OPT_OUT_KEY = 'notrack';
const REF_KEY = 'ref';

export interface TrackingParams {
    /** The raw `notrack` value, or null when the query has none. */
    notrack: string | null;
    /** The raw `ref` value, or null when the query has none. */
    ref: string | null;
    /** The search string without `ref` and `notrack`: `''` when nothing else is left, else `'?a=b'`. */
    remaining: string;
}

/** The last `?notrack` decision of this page load, kept in memory so it holds even when storage is blocked (FR-3). */
let optedOutThisLoad = false;

/** True after `?notrack=1`: earlier in this page load, or in this browser (`localStorage.notrack === '1'`). */
export function optedOut(): boolean {
    if (optedOutThisLoad) {
        return true;
    }
    try {
        return localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch {
        return false;
    }
}

/** `?notrack=1` stores the opt-out and `?notrack=0` removes it (D5). A blocked storage keeps it for this page load only. */
export function setOptOut(on: boolean): void {
    optedOutThisLoad = on;
    try {
        if (on) {
            localStorage.setItem(OPT_OUT_KEY, '1');
        } else {
            localStorage.removeItem(OPT_OUT_KEY);
        }
    } catch {
        // Storage blocked: the opt-out lasts until the page reloads.
    }
}

/** Keeps the ref tag for the browser session (SITE-003). Does nothing when storage is blocked. */
export function rememberRef(ref: string): void {
    try {
        sessionStorage.setItem(REF_KEY, ref);
    } catch {
        // Storage blocked: the tag is sent with the first view only.
    }
}

/** The ref tag kept for this session, or undefined when there is none or storage is blocked. */
export function storedRef(): string | undefined {
    try {
        return sessionStorage.getItem(REF_KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * True when a view may be sent: a production build (read at call time, so tests can stub it), no stored opt-out, and
 * no Global Privacy Control (FR-2, FR-3). lib.dom has no type for `globalPrivacyControl` yet.
 */
export function trackingAllowed(): boolean {
    if (!import.meta.env.PROD || optedOut()) {
        return false;
    }
    return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl !== true;
}

/** The referrer's origin (`https://www.linkedin.com`), never its path or query (P13); undefined when empty, unparsable, or not http(s). */
export function referrerOrigin(referrer: string): string | undefined {
    if (referrer === '') {
        return undefined;
    }
    try {
        const url = new URL(referrer);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : undefined;
    } catch {
        return undefined;
    }
}

/** Reads `notrack` and `ref` from a search string and returns the search string without them (FR-4). */
export function readTrackingParams(search: string): TrackingParams {
    const params = new URLSearchParams(search);
    const notrack = params.get('notrack');
    const ref = params.get('ref');
    params.delete('notrack');
    params.delete('ref');
    const rest = params.toString();
    return { notrack, ref, remaining: rest === '' ? '' : `?${rest}` };
}
