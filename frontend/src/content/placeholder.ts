/**
 * Placeholder copy for PF-003 (D2). Every portfolio text block stays a clearly marked placeholder until PF-012 swaps in
 * the owner-reviewed content pack; PF-012 also adds a content test that fails on any `TODO:`.
 */
const FILLER_WORDS = 'placeholder text of about the final length so the layout can be judged before the reviewed copy arrives'.split(' ');

/** `TODO: {block} (content pack C)`, padded with neutral filler words to about `words` words so the layout is realistic. */
export function todo(block: string, words = 0): string {
    const marker = `TODO: ${block} (content pack C)`;
    const missing = words - marker.split(' ').length;
    if (missing <= 0) {
        return marker;
    }
    const filler = Array.from({ length: missing }, (_, index) => FILLER_WORDS[index % FILLER_WORDS.length]).join(' ');
    return `${marker} ${filler}.`;
}

/** A placeholder link target, `#todo-{name}`, for a URL the content pack has not supplied yet. */
export function todoHref(name: string): string {
    return `#todo-${name}`;
}
