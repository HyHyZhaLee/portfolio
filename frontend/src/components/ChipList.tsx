/** A wrapping row of small labels, such as a stack or the three tech chips of a case study. */
export function ChipList({ items, label, className = '' }: { items: readonly string[]; label?: string; className?: string }) {
    return (
        <ul aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
            {items.map((item) => (
                <li key={item} className='rounded-full border border-line px-2.5 py-1.5 font-ui text-caption leading-none font-medium text-muted'>
                    {item}
                </li>
            ))}
        </ul>
    );
}
