// Fixed to English so digits group as 1,284 whatever the visitor's locale, matching the English UI (PF-005 P16).
const countFormat = new Intl.NumberFormat('en');

/** Formats an integer count with grouped digits, such as `1,284`. */
export function formatCount(value: number): string {
    return countFormat.format(value);
}
